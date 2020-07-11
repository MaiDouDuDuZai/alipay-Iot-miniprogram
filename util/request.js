export default function request(option) {
  let app = getApp();
  option.data = option.data || {};
  option.data = {
    version: app.Data.version || '',
    person_id: app.Data.person.person_id || '',
    person_token: app.Data.person.person_token || '',
    SN: app.Data.SN || '',
    // mini_container: app.Data.deviceInfo.firmware.container,
    // device_model: app.Data.deviceInfo.hardware.model,
    ...option.data,
  };
  if(!/^http/.test(option.url)){
    option.url = 'https://' + app.Data.config.API_URL + (app.Data.mock ? '/mock' : '') + option.url;
  }
  console.log(option.method || 'GET', option.url, option.data)
  my.request({
    url: option.url,
    headers: option.headers || {'content-type': 'application/json'},
    method: option.method || 'GET',
    data: option.data,
    timeout: option.timeout || 15000, //超时时间
    dataType: option.dataType || 'JSON',
    success: function(res){
      if(res.status != 200){
        my.hideLoading();
        my.alert({ title:'服务器错误', content: res.data.message });
        app.order.clearStatus();
        option.fail && option.fail(res.data);
      }else{
        //接口状态处理交给具体业务
        my.hideLoading();
        option.success && option.success(res.data);
      }
    },
    fail: function(err){
      console.warn(err)
      my.hideLoading();
      let errorMessage = {
        11: '无权跨域',
        12: '网络出错',
        13: '超时',
        14: '解码失败',
        19: 'HTTP错误',
        20: '请求已被停止/服务端限流'
      }[err.error] || err.errorMessage || '未知错误';
      my.alert({ title: errorMessage, content: err.data && err.data.message || '' });
      app.order.clearStatus();
      option.fail && option.fail(err);
    },
    //complete在success,fail后执行
    //模拟器：不管hideLoading在showToast之前还是之后，始终会覆盖showToast
    //蜻蜓：不管hideLoading在showToast之前还是之后，都互不影响
    //文档：在 my.showToast 之前调用 my.hideLoading，toast 被 my.hideLoading 覆盖，将不展示
    //以真机调试为准
    complete: function(res){
      console.log('response', res.data);
      option.complete && option.complete(res.data);
    }
  }).catch(e=>{})
}