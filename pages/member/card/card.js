let app = getApp();

Page({
  data: {
    card_no: '',
    user_id: '',
    card_logo: '',
    card_title: '',
    card_sub_title: '',
    card_bg: '',
    is_charge: false, //是否开启储值功能
    credit: '0.00',
    balance: '0.00',
    biz_card_no: '', //支付宝业务卡号
    titleBarHeight: 0,
    statusBarHeight: 0,
    showCharge: false,
    showCardActiveQrcode: false,
    qrcode_alipay: '',
  },
  onLoad(query) {
    app.page.onLoad(this);
    this.data.user_id = query.user_id;
    this.setData({
      titleBarHeight: app.Data.systemInfo.titleBarHeight,
      statusBarHeight: app.Data.systemInfo.statusBarHeight,
      is_charge: app.Data.card.alipay.is_charge,
    });
    this.getMemberInfo();
    app.order.clearStatus();
  },
  onShow(){
    app.page.onShow(this);
  },
  onHide(){
    app.page.onHide(this);
  },
  onChargeSuccess(){
    this.setData({ showCharge: false})
    this.getMemberInfo();
  },
  getMemberInfo(){
    let user_id = this.data.user_id;
    //查询会员信息
    my.showLoading({ content: '查询会员信息'});
    app.request({
      method: 'POST',
      url: app.api.alipay_card_userinfo,
      data: { user_id: user_id},
      success: (res) => {
        if(res.status == 0){
          return my.showToast({ content: res.message});
        }
        this.setData({
          card_no: res.contents.card_no,
          credit: res.contents.credit,
          balance: res.contents.balance,
          biz_card_no: res.contents.biz_card_no,
          card_logo: app.Data.card.alipay.card_logo_url,
          card_title: app.Data.card.alipay.card_show_name,
          card_bg: app.Data.card.alipay.card_bg_url,
        })
      }
    })
  },
  showCharge(){
    this.setData({ showCharge: true})
  },
  hideCharge(){
    this.setData({ showCharge: false});
    this.chargeComponent.clearStatus();
  },
  showCardActiveQrcode(){
    my.showLoading();
    app.request({
      url: app.api.card_activateurl,
      method: 'POST',
      data: { 
        template_id: app.Data.card.alipay.card_id, 
        out_string: JSON.stringify({
          user_id: this.data.user_id
        }),
      },
      dataType: 'json',
      success: (res) => {
        if(res.status == 0){
          return my.showToast({ content: res.message })
        }
        if(res && res.status == 1 && res.contents && res.contents.apply_card_url){
          let shorturl = decodeURIComponent(res.contents.apply_card_url);
          app.Data.card.alipay.card_activateurl.short = shorturl;
          this.genQrcode();
        }
      },
    });
  },
  hideCardActiveQrcode(){
    this.setData({ showCardActiveQrcode: false })
  },
  genQrcode(){
    my.ix.generateImageFromCode({
      code: app.Data.card.alipay.card_activateurl.short,
      format: 'QRCODE',
      width: 200,
      correctLevel: 'H',
      success:(r)=>{
        this.setData({ 
          qrcode_alipay: r.image,
          showCardActiveQrcode: true,
         })
      }
    });
  }
});
