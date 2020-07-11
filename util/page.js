/**
 * 全局计时器格式，便于unload统一处理
 * timer: {
 *   optMenu: { id: 0, count: 0 },
 *   btn: { id: 0, count: 0 },
 *   query: { id: 0, count: 0 }
 * },
 */

var obj = {
  onLoad( page ){
    console.log('--------pageOnLoad----------', page && page.route);
    my.setOptionMenu({
      icon: '/image/optionmenu.png'
    });
  },
  onShow( page ){
    console.log('--------pageOnShow----------', page && page.route);
  },
  onReady( page ){
    console.log('--------pageOnReady---------', page && page.route);
  },
  onHide( page ){
    console.log('--------pageOnHide----------', page && page.route);
    if(page.data.timer){
      for(let i in page.data.timer){
        clearTimeout(page.data.timer[i].id);
        page.data.timer[i].count = 0;
      }
    }
    my.hideLoading();
  },
  onUnload( page ){
    console.log('--------pageOnUnload--------', page && page.route);
    if(page.data.timer){
      for(let i in page.data.timer){
        clearTimeout(page.data.timer[i].id);
        page.data.timer[i].count = 0;
      }
    }
  },
  onOptionMenuClick( page ) {
    let app = getApp();
    page.data.timer = page.data.timer === undefined ? {} : page.data.timer;
    page.data.timer.optMenu = page.data.timer.optMenu ? page.data.timer.optMenu : { id: 0, count: 0 };
    clearTimeout(page.data.timer.optMenu.id);
    page.data.timer.optMenu.count++;
    if(page.data.timer.optMenu.count >= 8){
      page.data.timer.optMenu.count = 0;
      app.setting.logout();
      return;
    }
    page.data.timer.optMenu.id = setTimeout(() => {
      page.data.timer.optMenu.count = 0;
    }, 10000);
  },
  checkLogin(){
    let app = getApp();
    if( Object.keys(app.Data.person).length == 0 ){
      my.redirectTo({url: '/pages/login/login'});
      return false;
    }
    return true;
  }
}

export default obj;