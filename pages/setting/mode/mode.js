let app = getApp();

Page({
  data: {
    mode: '',
    items: [
      { name: '独立收银', value: '1', url: '/pages/cash/cash' },
      { name: '自助下单', value: '2', url: '/pages/cash/goods/goods', viewMode: 1 },
    ],
  },
  onLoad() {},
  onShow() {
    const active_mode = app.Data.config.mode;
    this.data.items.map((v) => {
      v.checked = v.value == active_mode.value ? true : false;
      if( active_mode.value == 2 ) v.viewMode = active_mode.viewMode || 1;
      return v;
    });
    this.setData({ 
      mode: app.Data.config.mode.value,
      items: [...this.data.items] 
    });
  },
  radioChange(e) {
    const mode = this.data.items.filter(v => v.value == e.detail.value)[0];
    app.Data.config.mode = mode;
    my.setStorageSync({
      key: 'config',
      data: app.Data.config,
    });
    this.setData({ mode: mode.value});
  },
  viewModeChange(e) {
    let viewMode = e.detail.value;
    app.Data.config.mode.viewMode = viewMode;
    my.setStorageSync({
      key: 'config',
      data: app.Data.config,
    });
    this.setData({ 'items[1].viewMode': viewMode})
  }
});
