let app = getApp();

Page({
  data: {
    showFilter: false,
    showBottom: false,
    loadMore: '',
    current_page: 0,
    last_page: '',
    total: 0,
    load_attempted: false, //是否加载过订单
    selected_order:{}, //选中的订单
    items: [],
    time_create: '', //筛选
    create_time_from: '',
    create_time_to: '',
    trade_gate: '', //筛选
    trade_type: '', //筛选
  },
  onLoad(){
    this.loadMore();
  },
  onShow(){},
  onReady(){},
  onHide(){},
  onUnload(){},
  onPullDownRefresh() {
    // 页面被下拉
  },
  onReachBottom() {
    this.loadMore();
  },
  onItemClick(eobj) {
    let {index, target} = eobj;
    this.setData({ 
      selected_order: {...this.data.items[index]},
      showBottom: true
    });
  },
  onPopupClose() {
    this.setData({
      showBottom: false,
    });
  },
  toggleFilter() {
    this.setData({
      showFilter: !this.data.showFilter,
    });
  },
  loadMore(reload = false){
    if( this.data.loadMore == 'over' && !reload ) return;
    const { items } = this.data;
    let param = {
      page: reload ? 1 : parseInt(this.data.current_page) + 1,
    };
    if(this.data.time_create) param.time_create = this.data.time_create;
    if(this.data.trade_gate) param.trade_gate = this.data.trade_gate;
    if(this.data.trade_type) param.trade_type = this.data.trade_type;
    app.request({
      url: app.api.order,
      method: 'post',
      data: param,
      success: res => {
        if(res.status == '0'){
          return my.showToast({ content: res.message});
        }
        let contents = res.contents, 
            list = contents.list, 
            newItems = [],
            setData = {};
        for(let i=0, len = list.length; i < len; i++){
          newItems.push({
            time_create: list[i].time_create,
            time_create_format: app.util.timestampFormatter(list[i].time_create, 'Y-M-D h:m:s'),
            out_trade_no: list[i].out_trade_no,
            trade_status: list[i].trade_status,
            total_amount: list[i].total_amount,
            trade_gate: list[i].trade_gate,
            trade_type: list[i].trade_type,
          });
        }
        newItems = reload ? newItems : items.concat(newItems);
        setData = {
          ...setData,
          items: newItems,
          current_page: contents.current_page,
          last_page: contents.last_page,
          total: contents.total,
          loadMore: parseInt(contents.current_page) >= parseInt(contents.last_page) ? 'over' : 'load'
        };
        this.setData(setData);
      }
    })
  },
  //补打
  reprint(){
    app.Data.order = {
      ...app.Data.order,
      totalAmount: this.data.selected_order.total_amount, //注意totalamount拼写不同
      out_trade_no: this.data.selected_order.out_trade_no,
      trade_gate: this.data.selected_order.trade_gate,
      time_create: this.data.selected_order.time_create
    };
    app.printer.printReceipt(res=>{
      app.Data.order.printed = false; //可多次重打
    });
  },
  //退款订单
  refund(){
    const out_trade_no = this.data.selected_order.out_trade_no;
    let items = [...this.data.items];
    app.setting.entry( res => {
      res && app.order.refund({
        out_trade_no: out_trade_no,
        success: res => {
          items.forEach((elem, index, arr) => {
            if( elem.out_trade_no == out_trade_no ){
              arr[index]['trade_status'] = 'CLOSED';
            }
          })
          this.setData({
            showBottom: false,
            items: items
          })
        }
      });
    })
  },
  datePicker(event){
    let now = app.util.timestampFormatter(event.timeStamp/1000, 'Y-M-D');
    my.datePicker({
      currentDate: now,
      startDate: '1970-01-01',
      endDate: now,
      success: (res) => {
        let setData = {};
        setData[event.target.dataset.name] = res.date;
        this.setData(setData)
      },
    });
    return false;
  },
  onFilterConfirm(data) {
    let filter = {
      trade_gate: [],
      trade_type: []
    };
    data.map((elem)=>{
      filter[elem.field].push( elem.value );
    });
    for(let i in filter){
      filter[i] = filter[i].join(',');
    }
    let setData = {
      showFilter: false,
      ...filter
    };
    if(this.data.create_time_from || this.data.create_time_to){
      if(!(this.data.create_time_from && this.data.create_time_to)){
        my.showToast({ type:'exception', content:this.data.create_time_from ?  '结束时间必填' : '开始时间必填' });
        return;
      }
      setData.time_create = this.data.create_time_from + '~' + this.data.create_time_to;
    }else{
      setData.time_create = '';
    }
    this.setData(setData);
    this.loadMore(true);
  },
  onFilterReset(){
    this.setData({
      create_time_from: '',
      create_time_to: ''
    })
  }
});