import fmtEvent from '../_util/fmtEvent';
Component({
  props: {
    type: 'number',
    className: '',
    focus: false,
    placeholder: '',
    value: '',
    controlled: false
  },
  data: {
    _focus: false
  },
  didMount: function didMount() {
    this.setData({
      _focus: this.props.focus
    });
  },
  didUpdate: function didUpdate(prevProps) {
    var prevFocus = prevProps.focus;
    var nowFocus = this.props.focus;

    if (prevFocus !== nowFocus) {
      this.setData({
        _focus: nowFocus
      });
    }
  },
  methods: {
    onInput: function onInput(e) {
      var event = fmtEvent(this.props, e);

      if (this.props.onInput) {
        this.props.onInput(event);
      }
    },
    onConfirm: function onConfirm(e) {
      var event = fmtEvent(this.props, e);

      if (this.props.onConfirm) {
        this.props.onConfirm(event);
      }
    },
    onButtonClick: function onButtonClick() {
      if (this.onButtonClick) {
        this.props.onButtonClick();
      }
    },
    onFocus: function onFocus(e) {
      this.setData({
        _focus: true
      });
      var event = fmtEvent(this.props, e);

      if (this.props.onFocus) {
        this.props.onFocus(event);
      }
    },
    onBlur: function onBlur(e) {
      this.setData({
        _focus: false
      }); // my.alert({ content: '_focus: ' + this.data._focus });

      var event = fmtEvent(this.props, e);

      if (this.props.onBlur) {
        this.props.onBlur(event);
      }
    },
    onClearTap: function onClearTap() {
      // my.alert({ content: 'manually focus' });
      this.setData({
        _focus: true
      });

      if (this.props.onClear) {
        this.props.onClear();
      }
    }
  }
});