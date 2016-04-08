var makeNetwork = require('./makeNetwork.js').make;

var Network = React.createClass({

  render: function() {

    makeNetwork(this.props.year, this.props.quarter)

    return (
      <div id="networkContainer"> </div>
    )
  }
})