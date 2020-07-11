Component({
  props: {
    title: '',
    used: false,
    onCouponClick: function onCouponClick() {},
    // 票券的扩展类型
    extra: true,
    moreBtn: '规则详情',
    moreHide: true
  },
  methods: {
    onCouponClick: function onCouponClick(e) {
      var onCouponClick = this.props.onCouponClick;
      onCouponClick(e);
    },
    catchActionTap: function catchActionTap() {},
    changeMoreState: function changeMoreState() {
      var moreHide = this.props.moreHide;
      this.props.moreHide = !moreHide;
      this.setData({
        moreHide: !moreHide
      });
    }
  }
});