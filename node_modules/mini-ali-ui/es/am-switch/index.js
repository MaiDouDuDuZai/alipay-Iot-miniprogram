import fmtEvent from '../_util/fmtEvent';
Component({
  props: {
    checked: false,
    disabled: false,
    onChange: function onChange() {},
    id: '',
    name: '',
    controlled: false
  },
  data: {
    checkedCls: ''
  },
  methods: {
    onChange: function onChange(e) {
      var event = fmtEvent(this.props, e);
      this.props.onChange(event);
    }
  }
});