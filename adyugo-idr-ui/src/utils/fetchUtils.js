import apiUtils from './apiUtils';

const columns = [
  {
    header: 'Success',
    accessorKey: 'isSuccess',
    Cell: ({ cell, row }) => {
      const value = cell.getValue();
      const isParent = row.depth === 0;
      return (
        <div style={{ marginLeft:row.depth === 0 ? '16px': '17px' }}>
          {isParent ? (
            <span style={{ 
              fontSize: '14px' 
            }}>
              N/A
            </span>
          ) : (
            <span style={{ 
              color: value === true ? 'green' : value === false ? 'red' : 'gray', 
              fontSize: '18px' 
            }}>
              {value === true ? '✅' : value === false ? '❌' : '🕓'}
            </span>
          )}
        </div>
      );
    }
  },
  {
    header: 'Current value',
    accessorKey: 'previousValue',
  },
  {
    header: 'New value',
    accessorKey: 'nextValue',
  },
  {
    header: 'Remarks',
    accessorKey: 'errorMessage',
  }
];


const getNextVersionNumber = (str) => {
  return str.replace(/_v(\d+)$/, (_, version) => `_v${parseInt(version) + 1}`);
}

const convertColumnData = (data)=>{
  const rowData = [];
  const keys = Object.keys(data);
  for( let i=0;i<keys.length;i+=1){
      const row = {};
      const {id,package_name,name} = data[keys[i]];
      row.previousValue = `${package_name} - ${id } - ${name}`;
      row.id = id;
      row.subRows = [];
      const childUnits = data[keys[i]] && data[keys[i]].adUnits;
      for(let j=0;j<childUnits.length;j+=1){
          row.subRows.push({previousValue: childUnits[j], nextValue: getNextVersionNumber(childUnits[j])});
      }
      rowData.push(row);
  }
  return rowData;
}

const refreshAdUnit = async(unitData, networkPatterns,apiKey) => {
  let status = false;
  let errorMessage = '';
    try{
      const valueFromServer = await apiUtils.getAdUnitById(unitData.id,apiKey);
      if(!valueFromServer || valueFromServer.errorMessage){
        status = false;
        errorMessage = JSON.stringify(valueFromServer.errorMessage);
      } else {
        const {ad_network_settings} = valueFromServer;
        if(ad_network_settings && ad_network_settings.length){
            for(let i=0;i<ad_network_settings.length;i+=1){
                const {GOOGLE_AD_MANAGER_NETWORK : googleNetwork} = ad_network_settings[i];
                if(googleNetwork && googleNetwork.ad_network_ad_units && googleNetwork.ad_network_ad_units.length){
                    const adUnits = googleNetwork.ad_network_ad_units;
                    for(let j=0;j<adUnits.length;j++){
                        const adUnit = adUnits[j];
                        if (
                          adUnit.ad_network_ad_unit_id &&
                          networkPatterns &&
                          networkPatterns.some(pattern =>
                            adUnit.ad_network_ad_unit_id.startsWith(`/${pattern}`)
                          )
                        ) {
                          // if present in mapper
                          const foundItem = unitData.subRows.find(
                            (item) => item.previousValue === adUnit.ad_network_ad_unit_id
                          );
                          if (foundItem && foundItem.nextValue) {
                            adUnits[j].ad_network_ad_unit_id = foundItem.nextValue;
                          }
                        }
                    }
                }
            }
        }
        const res = await apiUtils.setAdUnitById(unitData.id,apiKey,valueFromServer);
        status = res;
      }
    }catch(e){
      status = false;
      errorMessage = JSON.stringify(e);
    }
      unitData.isSuccess = status;
      unitData.errorMessage = errorMessage;
      unitData.subRows = unitData.subRows.map((data)=>{
        data.adUnitId = unitData.id;
        if(data.previousValue === data.nextValue){
          data.isSuccess = 'Unattempted';
          data.errorMessage = 'Refresh not supported for this ad unit. Please contact your AppBroda AM';
        }else{
          data.isSuccess = status;
          data.errorMessage = errorMessage;
        }
        return data;
      })  
      try{

      }catch(e){
        if(unitData.isSuccess){
          // await apiUtils.handleSendNotification({text: `*✅ Success*\nParent notification failed due to slack issue. Summary of request => ${unitData.id} succeeded in refresh!`});
        }else{
          // await apiUtils.handleSendNotification({text: `*❌ Failed*\nParent notification failed due to slack issue. Summary of request => ${unitData.id} failed to refresh! with error ${unitData.errorMessage}`});
        }
      }
      return unitData;
}

const onConfirm = async (rows, networkPatterns, apiKey) => {
  try {
    // await apiUtils.handleSendNotification({text: "<---- Replacement of ID started ---->"});
    const results = await Promise.all(
      rows.map((row) => refreshAdUnit(row, networkPatterns, apiKey))
    );
    // Send notification to slack
    // const dataToStoreInSlack = await apiUtils.handleSendNotification({csv: results});
    // console.log(dataToStoreInSlack,results);
    return results;
  }catch(e){
    alert(e);
  }
};

 const getAdUnitsTable = async(managementKey, networkPatterns) => {
    const allUnitData = await apiUtils.getAllAdUnits(managementKey);
    if(!allUnitData || allUnitData.errorMessage){
      throw new Error(allUnitData ? JSON.stringify(allUnitData.errorMessage) : 'Something is not working') ;
    }
    const allUnitsDetailedData = await Promise.all(allUnitData.map((unit)=>{
        return apiUtils.getAdUnitById(unit.id,managementKey);
    }));
    /* If any error in a fetch just block out */
     allUnitsDetailedData.forEach((data)=>{
      if(!data || data.errorMessage){
        throw new Error(data ? JSON.stringify(data.errorMessage) : 'Something is not working') ;
      }
    });

    const mapper = {};
    allUnitsDetailedData.forEach((unitData)=>{  
        const {ad_network_settings,name,platform,ad_format,package_name,id} = unitData;
        mapper[id] = {id,name,platform,ad_format,package_name, adUnits:[]}
        if(ad_network_settings && ad_network_settings.length){
            for(let i=0;i<ad_network_settings.length;i+=1){
                const {GOOGLE_AD_MANAGER_NETWORK : googleNetwork} = ad_network_settings[i];

                if(googleNetwork && googleNetwork.ad_network_ad_units && googleNetwork.ad_network_ad_units.length){
                    const adUnits = googleNetwork.ad_network_ad_units;
                    for(let j=0;j<adUnits.length;j++){
                        const adUnit = adUnits[j];
                        if (
                          adUnit.ad_network_ad_unit_id &&
                          networkPatterns &&
                          networkPatterns.some(pattern =>
                            adUnit.ad_network_ad_unit_id.startsWith(`/${pattern}`)
                          )
                        ) {
                          mapper[id].adUnits.push(adUnit.ad_network_ad_unit_id);
                        }
                    }
                }
            }
        }
    });
    Object.keys(mapper).forEach((key) => {
        if (!mapper[key].adUnits || mapper[key].adUnits.length === 0) {
          delete mapper[key];
        }
      });
    return mapper;
 }

 const fetchUtils =  {columns , convertColumnData, getAdUnitsTable,onConfirm  };
 export default fetchUtils;
