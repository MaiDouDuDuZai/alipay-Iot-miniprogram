let app = getApp();
let _goods = [];

Page({
  data: {
    viewMode: '',
    activeTab: 0,
    cats: [], //分类模式
    goods: [], //列表模式
    total_price: 0,
    total_num: 0,
    trade_type: '', // face_code|bar_code|card
    paying: false, //支付中状态，支付按钮加载中状态
    cartPanel: {
      show: false,
      cart: [], //部分浅拷贝goods
    },
    skuPanel: {
      show: false,
      title: '测试',
      goods_id: 1,
      _list:[], //xx商品的Sku, group的源数据
      group:{}, //规格组
      cur_sku: { path: '', data: {} }, //当前匹配的Sku { attr: x/x/x, price, cart_num}
    },
    keyEventHandler: {
      133: function(){ my.navigateBack() }
    }
  },
  onLoad: function (options) {
    app.page.onLoad(this);
    if( !app.page.checkLogin() ) return;
    //完整重置金额、购物车(订单收银)
    app.Data.order = {
      ...app.Data.order,
      totalAmount: 0,
      total_price: 0,
      pay_price: 0,
      goods: [],
    };
    app.order.clearStatus();
    //视图模式
    this.setData({ viewMode: app.Data.config.mode.viewMode });
    this.initGoods();
    //清空购物车(页面关闭后再进入时购物车商品未清空，猜测是引用了内部变量_goods的原因)
    this.setData({ 'cartPanel.cart': [] })
  },
  onShow: function () {
    app.page.onShow(this);
    //更新菜单样式
    if(this.data.viewMode != app.Data.config.mode.viewMode && app.page.checkLogin()){
      my.redirectTo({ url: '/pages/cash/goods/goods' });
    }
  },
  onReady: function () {
    app.page.onReady(this);
  },
  onHide: function () {
    app.page.onHide(this);
    this.setData({ paying: false });
  },
  onUnload: function () {
    app.page.onUnload(this);
  },
  onPullDownRefresh: function () {

  },
  onReachBottom: function () {

  },
  initGoods(){
    let viewMode = app.Data.config.mode.viewMode;
    app.request({
      method: 'post',
      url: app.api.goods_cat,
      success: res => {
        if(res.status == '0'){
          return my.showToast({ content: res.message});
        }
        let cats = res.contents.list;
        cats.map( v => {
          return Object.assign(v, { title: v.cat_name, anchor: v.cat_id });
        })
        app.request({
          method: 'post',
          url: app.api.goods,
          success: res => {
            if(res.status == '0'){
              return my.showToast({ content: res.message});
            }
            let list = res.contents.list, goods = {};
            _goods = list;
            if(viewMode == 1){
              for(let good of list){
                if (!goods[good.cat_id]){
                  goods[good.cat_id] = [];
                }
                goods[good.cat_id].push(good);
              }
              for(let cat of cats){
                cat.goods = goods[cat.cat_id];
              }
              this.setData({ 
                cats, 
                viewMode: this.data.viewMode
              })
            }
            if(viewMode == 2){
              this.setData({ 
                goods: _goods,
                viewMode: this.data.viewMode
              })
            }
          }
        })
      }
    })
  },
  //三种加购方式：主列表、购物车、规格面板
  addCart(e){
    let {goods_id, attr} = e.target.dataset,
      item = _goods.find(v => v.goods_id == goods_id), //cart_num = sku合计
      sku = this.find_in_cart(goods_id, attr); //含无规格商品
    //多规格商品首次加购一定是从面板加购
    if(!sku){
      //组合goods和sku作为独立商品加购
      sku = {
        ...item,
        goods_name: item.goods_name + ( Number(item.use_attr) ? '(' + this.data.skuPanel.cur_sku.path + ')' : ''),
        attr: Number(item.use_attr) ? this.data.skuPanel.cur_sku.path : false,
        price: Number(item.use_attr) ? this.data.skuPanel.cur_sku.data.price : item.price,
        cart_num: 0,
      };
      this.data.cartPanel.cart.push(sku);
    }
    item.cart_num = item.cart_num >= 0 ? item.cart_num + 1 : 1;
    sku.cart_num = sku.cart_num >= 0 ? sku.cart_num + 1 : 1;
    //update main list (price, cart_num)
    let { cat_index, goods_index } = this._getTargetIndex(sku);
    let data = {
      'cartPanel.cart': [...this.data.cartPanel.cart],
      total_num: this.data.total_num + 1,
      total_price: ((this.data.total_price*100 + sku.price*100)/100).toFixed(2)
    };
    if(this.data.viewMode == 1){
      data['cats[' + cat_index + '].goods[' + goods_index + '].cart_num'] = item.cart_num;
    }
    if(this.data.viewMode == 2){
      data['goods[' + goods_index + '].cart_num'] = item.cart_num;
    }
    //update panel (cart_num)
    if(this.data.skuPanel.show){
      data['skuPanel.cur_sku.data.cart_num'] = sku.cart_num;
    }
    this.setData(data);
  },
  minusCart(e){
    let {goods_id, attr} = e.target.dataset,
      item = _goods.find(v => v.goods_id == goods_id), //cart_num = sku合计
      sku = this.find_in_cart(goods_id, attr); //含无规格商品
    item.cart_num = item.cart_num > 0 ? item.cart_num - 1 : 0;
    sku.cart_num = sku.cart_num > 0 ? sku.cart_num - 1 : 0;
    let { cat_index, goods_index } = this._getTargetIndex(sku);
    let data = {
      'cartPanel.cart': this.data.cartPanel.cart.filter(v => v.cart_num > 0),
      total_num: this.data.total_num - 1,
      total_price: ((this.data.total_price*100 - sku.price*100)/100).toFixed(2),
    };
    if(this.data.viewMode == 1){
      data['cats[' + cat_index + '].goods[' + goods_index + '].cart_num'] = item.cart_num;
    }
    if(this.data.viewMode == 2){
      data['goods[' + goods_index + '].cart_num'] = item.cart_num;
    }
    if (this.data.total_num - 1 == 0) data['cartPanel.show'] = false;
    //update panel (cart_num)
    if(this.data.skuPanel.show){
      data['skuPanel.cur_sku.data.cart_num'] = sku.cart_num;
    }
    this.setData(data);
  },
  find_in_cart(goods_id, attr = false){
    return this.data.cartPanel.cart.find(v => {
      let has_goods_id = v.goods_id == goods_id;
      let has_sku = true;
      if(attr){
        has_sku = v.attr == attr;
      }
      return has_goods_id && has_sku;
    });
  },
  _getTargetIndex(target){
    let cat_index = '', goods_index = '';
    if(this.data.viewMode == 1){
      this.data.cats.forEach((cat, index) => {
        if( cat.cat_id == target.cat_id ){
          cat_index = index;
          cat.goods.forEach((good, i) => {
            if( good.goods_id == target.goods_id ) goods_index = i;
          })
        }
      });
    }
    if(this.data.viewMode == 2){
      _goods.forEach((good, i) => {
        if( good.goods_id == target.goods_id ) goods_index = i;
      })
    }
    return { cat_index, goods_index };
  },
  toggleCart(){
    if(this.data.cartPanel.cart.length){
      this.setData({ 'cartPanel.show': !this.data.cartPanel.show })
    }
  },
  onSubmit(){
    if( parseFloat( this.data.total_price ) == 0 ){
      return my.showToast({ type:'exception', content: '金额错误' })
    }
    this.confirm();
  },
  confirm(e) {
    if (this.data.paying) return;
    let goods = [];
    this.data.cartPanel.cart.forEach(v => {
      let good = { goods_id: v.goods_id, goods_name: v.goods_name, num: v.cart_num, price: v.price };
      if(v.attr){
        good.attr = v.attr.split('/');
      }
      goods.push(good);
    });
    this.setData({ paying: true });
    app.Data.order.goods = goods;
    my.navigateTo({ url: '/pages/cash/cash?amount=' + this.data.total_price + '&showGoods=1' });
  },
  onTabClick(index) {
    this.setData({
      activeTab: index,
    });
  },
  onTabChange(index) {
    this.setData({
      activeTab: index,
    });
  },
  showSkuPanel(e){
    let goods_id = e.target.dataset.goods_id,
        item = _goods.find(v => v.goods_id == goods_id);
    this.data.skuPanel.goods_id = goods_id;
    app.request({
      method: 'post',
      url: app.api.goods_detail,
      data: { goods_id: goods_id},
      success: (res) => {
        if(res.status == '0'){
          return my.showToast({ content: res.message});
        }
        let list = res.contents.data.attr;
        this.data.skuPanel._list = list;
        this.gen_group_from_sku_list();
        this.setData({
          'skuPanel.goods_id': goods_id,
          'skuPanel.show': true,
          'skuPanel.title': item.goods_name,
          'skuPanel.cur_sku': {
            path: this.data.skuPanel.cur_sku.path,
            data: this.find_sku_by_path()
          }
        });
      }
    })
  },
  hideSkuPanel(e){
    this.setData({
      'skuPanel.show': false
    })
  },
  gen_group_from_sku_list(){
    const list = this.data.skuPanel._list;
    let group = {};
    this.data.skuPanel.cur_sku.path = [];
    for(let i in list){
      let attr_list = list[i].attr_list;
      for(let j in attr_list){
        let attr = attr_list[j], cur_group = group[attr.group_name];
        if(!cur_group){
          cur_group = [];
        }
        let duplicate = false;
        for(let k in cur_group){//去重
          if(cur_group[k].name == attr.name){
            duplicate = true;
            break;
          }
        }
        if(!duplicate){
          !cur_group.length && this.data.skuPanel.cur_sku.path.push(attr.name);//默认选中
          cur_group.push({name: attr.name, active: cur_group.length ? false : true});
        }
        group[attr.group_name] = cur_group;
      }
    }
    this.data.skuPanel.cur_sku.path = this.data.skuPanel.cur_sku.path.join('/');
    this.setData({ 'skuPanel.group': group });
  },
  find_sku_by_path(){
			const list = this.data.skuPanel._list;
			const cur_path = this.data.skuPanel.cur_sku.path;
			const matched_sku = list.find(sku => {
				let path = sku.attr_list.reduce((acc,cur) => acc + (acc ? '/' : '') + cur.name, '');
				return path == cur_path;
			});
      //todo: 从购物车取加购数
      let goods = this.find_in_cart(this.data.skuPanel.goods_id, cur_path);
      if(goods) matched_sku.cart_num = goods.cart_num;
      return matched_sku;
  },
  pick_attr(e){
    let {group_name, attr_index} = e.target.dataset;
    let group_names = Object.keys(this.data.skuPanel.group);
    let group_index = 0;
    let path = this.data.skuPanel.cur_sku.path.split('/');
    group_names.forEach((v,i) => {
      if(v == group_name) group_index = i;
    })
    this.data.skuPanel.group[group_name].map((v,i)=>{
      if(i == attr_index){
        v.active = true;
        path[group_index] = v.name;
      }else{
        v.active = false;
      }
    });
    this.data.skuPanel.cur_sku.path = path.join('/');
    this.setData({ 
      ['skuPanel.group['+group_name+']']: [...this.data.skuPanel.group[group_name]],
      'skuPanel.cur_sku': {
        path: this.data.skuPanel.cur_sku.path,
        data: this.find_sku_by_path(),
      }
    });
  },
})