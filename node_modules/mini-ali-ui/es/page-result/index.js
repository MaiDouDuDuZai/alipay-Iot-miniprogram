var defaultEvent = function defaultEvent() {};

var COUNT_DOWN_TIMES = 10;
Component({
  props: {
    className: '',
    type: 'network',
    local: false,
    footer: null,
    onTapLeft: defaultEvent,
    onTapRight: defaultEvent,
    isCountDown: false,
    countDownText: '重新刷新'
  },
  data: {
    defaultTitle: {
      network: '网络不给力',
      error: '页面遇到一些小问题',
      busy: '请稍等哦，马上出来',
      empty: '什么都没有',
      logoff: '此用户已注销',
      payment: '付款没成功',
      redpacket: '什么都没有'
    },
    defaultBrief: {
      network: '世界上最遥远的距离莫过于此',
      error: '请稍后刷新',
      busy: '前面还有很多朋友在排队',
      empty: '前不见古人，后不见来者',
      logoff: '',
      payment: '请重新付款',
      redpacket: '红包已领空'
    },
    countDownTitle: ''
  },
  didMount: function didMount() {
    var _this = this;

    var _this$props = this.props,
        countDownText = _this$props.countDownText,
        isCountDown = _this$props.isCountDown;

    if (!isCountDown) {
      return;
    }

    var countDownTimes = COUNT_DOWN_TIMES;
    this._timer = null;

    var execCountDown = function execCountDown() {
      _this.setData({
        countDownTitle: countDownTimes + " \u79D2\u540E" + countDownText
      });

      countDownTimes -= 1;

      if (countDownTimes < 0) {
        clearTimeout(_this._timer);

        _this.setData({
          isCountDown: false
        });
      } else {
        _this._timer = setTimeout(execCountDown, 1000);
      }
    };

    execCountDown();
  },
  didUnmount: function didUnmount() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  },
  methods: {
    onDefaultTap: function onDefaultTap(propName) {
      if (this.props.footer && this.props[propName]) {
        var _this$props2;

        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        (_this$props2 = this.props)[propName].apply(_this$props2, args);
      } else {
        defaultEvent();
      }
    },
    onLeftButton: function onLeftButton() {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      this.onDefaultTap.apply(this, ['onTapLeft'].concat(args));
    },
    onRightButton: function onRightButton() {
      for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
        args[_key3] = arguments[_key3];
      }

      this.onDefaultTap.apply(this, ['onTapRight'].concat(args));
    }
  }
});