import fmtEvent from '../../_util/fmtEvent';
Component({
  props: {
    className: ''
  },
  methods: {
    onItemClick: function onItemClick(e) {
      if (this.props.onItemClick && typeof this.props.onItemClick === 'function') {
        var event = fmtEvent(this.props, e);
        this.props.onItemClick(event);
      }
    }
  }
});