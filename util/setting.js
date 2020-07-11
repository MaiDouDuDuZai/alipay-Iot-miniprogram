//设置页面鉴权并跳转
function entry ( cb = '' ) {
  let app = getApp();
  if(!cb){
    cb = res => {
      res && my.navigateTo({url: '/pages/setting/setting'});
    }
  }
  if( !app.Data.person.person_id ){
    my.showToast({ type: 'exception', content: '请先登录' });
    cb(false);
    return false;
  }
  my.prompt({
    title: '输入密码',
    message: '请输入设置页访问密码',
    placeholder: '密码',
    okButtonText: '确定',
    cancelButtonText: '取消',
    success: (result) => {
      if(!result.ok){
        cb(false);
        return false;
      }
      let password = result.inputValue;
      my.showLoading();
      app.request({
        url: app.api.check,
        method: 'POST',
        data: {
          password: password,
        },
        success: (res) => {
          if(!res.status || res.status == 0){
            my.showToast({ type: 'exception', content: res.message });
            cb(false);
            return false;
          }
          cb(true);
        }
      });
    },
  });
}

function logout() {
  let app = getApp();
  app.Data.person = {};
  my.removeStorageSync({ key: 'person' });
  my.reLaunch({url: '/pages/login/login'});
}

export default {entry, logout};