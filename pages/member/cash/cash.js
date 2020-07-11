//非会员不得入内
let app = getApp();

Page({
  data: {
    user_id: '',
    card_no: '',
    amount: 0,
    credit: 0,
    balance: 0,
    showCharge: false,
    paying: false,
    afford: true, //余额是否足够
    is_charge: false, //是否开启储值功能
    keyEventHandler: {
      133: function(){ my.navigateBack() }
    }
  },
  onLoad(query) {
    app.page.onLoad(this);
    this.data.user_id = query.user_id;
    this.data.amount = query.amount;
    this.getMemberInfo();
  },
  onShow(){
    app.page.onShow(this);
  },
  onChargeSuccess(){
    this.setData({ showCharge: false})
    this.getMemberInfo();
  },
  getMemberInfo(){
    let user_id = this.data.user_id;
    //查询会员信息
    my.showLoading();
    app.request({
      method: 'POST',
      url: app.api.alipay_card_userinfo,
      data: { user_id: user_id},
      success: res => {
        if(res.status == 0){
          return my.showToast({ content: res.message });
        }
        this.setData({
          amount: this.data.amount,
          card_no: res.contents.card_no,
          credit: res.contents.credit,
          balance: res.contents.balance,
          afford: Number(res.contents.balance) >= Number(this.data.amount),
          is_charge: app.Data.card.alipay.is_charge,
        })
      }
    })
  },
  showCharge(){
    this.setData({ showCharge: true});
  },
  hideCharge(){
    this.setData({ showCharge: false});
    this.chargeComponent.clearStatus();
  },
  //会员支付
  confirm(e){
    if(this.data.paying) return;
    let biz_type = 'normal', trade_type = 'card';
    this.setData({ paying: true });
    app.order.posConfirm({
      biz_type,
      card_no: this.data.card_no,
      trade_type,
      totalAmount: this.data.amount, 
      onerror: ()=>{
        this.setData({ paying: false})
      },
      onCashierClose: ()=>{
        console.log('onCashierClose')
        this.setData({ paying: false})
      },
      oncancel: ()=>{
        this.setData({ paying: false})
      }
    });
  },
});
