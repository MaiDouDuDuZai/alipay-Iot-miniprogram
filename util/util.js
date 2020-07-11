function isDev(){
  return my.ix.getSysPropSync({ key: 'ro.serialno' }) ? false : true; //判断是否真机
}

//短链接
function shortlink(option) {
  my.showLoading({content:'获取短链接'});
  let app = getApp();
  option = {
    url: '',
    success: ()=>{},
    complete: ()=>{},
    ...option
  };
  let {url, success, complete} = option;
  app.request({
    url: app.api.shortlink,
    method: 'POST',
    data: {
      url: url
    },
    dataType: 'json',
    success: res => {
      if(res.status == 0){
        return my.showToast({ content: res.message});
      }
      success(res);
    }
  });
}

function  dateFormatter () {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const strDate = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return `${date.getFullYear()}/${month}/${strDate} ${hour}:${minute}:${second}`;
}
/** 
 * 时间戳转化为年 月 日 时 分 秒 
 * number: 传入时间戳 
 * format：返回格式，支持自定义，但参数必须与formateArr里保持一致 
*/  
function timestampFormatter(number,format) {
  var formateArr  = ['Y','M','D','h','m','s'];  
  var returnArr   = [];  
  
  var date = new Date(number * 1000);
  returnArr.push(date.getFullYear());  
  returnArr.push(formatNumber(date.getMonth() + 1));  
  returnArr.push(formatNumber(date.getDate()));  
  
  returnArr.push(formatNumber(date.getHours()));  
  returnArr.push(formatNumber(date.getMinutes()));  
  returnArr.push(formatNumber(date.getSeconds()));  
  
  for (var i in returnArr)  
  {  
    format = format.replace(formateArr[i], returnArr[i]);  
  }  
  return format;
}
//数据转化  
function formatNumber(n) {  
  n = n.toString()  
  return n[1] ? n : '0' + n  
}

/**
 * 清除缓存
 */
function clearCache( option = {} ){
  option = {
    person: false, //是否清除当前登录用户
    success: ()=>{},
    ...option
  };
  let {person, success} = option;
  my.removeStorageSync({ key: 'config' });
  // person && my.removeStorageSync({ key: 'person' });
  success && success();
}

//设备状态监测
function send_heartbeat(){
  let app = getApp();
  let data = {
    version: app.Data.version || '',
    person_id: app.Data.person.person_id || '',
    SN: app.Data.SN || '',
    mini_container: app.Data.deviceInfo.firmware.container,
    device_model: app.Data.deviceInfo.hardware.model,
    location: app.Data.location,
  };
  my.sendSocketMessage({
    data: JSON.stringify(data),
    success: (res) => {
      // console.log('心跳', data)
      clearTimeout(app.Data.websocket.heartbeat);
      app.Data.websocket.heartbeat = setTimeout( app.util.send_heartbeat, 5000);
    },
    fail: res => {
      console.log('心跳失败', res)
    }
  }).catch(err => {
    // console.warn(err)
  });
}

export default {dateFormatter, timestampFormatter, shortlink, clearCache, isDev, send_heartbeat}