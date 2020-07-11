let app = getApp();

Component({
  mixins: [],
  data: {
    card_charge: [],
    paying: false,
    charge_id: 0,
  },
  props: {
    onChargeSuccess: ()=>{}
  },
  didMount() {
    this.$page.chargeComponent = this; // 通过此操作可以将组件实例挂载到所属页面实例上
    this.setData({
      card_charge: app.Data.merchant.card_charge
    });
  },
  didUpdate() {},
  didUnmount() {},
  methods: {
    clearStatus(){
      this.setData({
        paying: false,
        charge_id: 0,
      })
    },
    success(){
      this.clearStatus();
      //收银台关闭后充值成功显示这个提示
      app.Data.cashier.status == 0 && my.showToast({ content: '会员充值成功', type:'success'});
      this.props.onChargeSuccess();
    },
    fail(type = 0){
      this.clearStatus();
      let title = type == 0 ? '支付失败' : '服务器错误';
      my.showToast({ content: app.Data.order.errorMessage || title, type: 'exception'});
      app.native.playAudio();
    },
    //确认付款
    confirm(e){
      if(this.data.paying) return;
      let biz_type = 'charge', 
        trade_type = '',
        pay_amount = e.target.dataset.pay_amount,
        send_amount = e.target.dataset.send_amount,
        card_no = this.$page.data.card_no;
      this.setData({
        paying: true, 
        charge_id: e.target.dataset.id,
        biz_type,
        trade_type,
      });
      let _this = this;
      app.order.posConfirm({
        biz_type,
        card_no,
        trade_type,
        totalAmount: pay_amount,
        showMessagePage: false,
        afterPay: ()=>{
          //当前订单状态
          if(app.Data.order.status == 3){
            return _this.fail();
          }
          //调用接口查询订单状态
          app.order.query({
            success: () => {
              app.Data.order.status == 2 ? _this.success() : _this.fail();
            },
            fail: () => {
              _this.fail(-1);
            }
          });
        },
        onerror: ()=>{
          this.clearStatus();
        },
        onCashierClose: ()=>{
          console.log('onCashierClose')
          //收银台关闭前充值成功显示这个提示
          app.Data.order.status == 2 && my.showToast({ content: '会员充值成功', type:'success'});
        },
        oncancel: ()=>{
          this.clearStatus();
        }
      });
    },
  },
});
