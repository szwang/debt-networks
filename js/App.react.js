/**
 * @jsx React.DOM
 */

// var makeNetwork = require('./makeNetwork.js').make;

var Network = React.createClass({
  render: function() {
    make(this.props.year, this.props.quarter)
    return (
      <div id="networkContainer"> </div>
    )
  }
})

var App = React.createClass({
  getInitialState: function() {
    return {
      year: 2015,
      quarter: 2
    }
  },

  render: function() {
    return (
      <div> <Network year={this.state.year} quarter={this.state.quarter}/> </div>
    )
  }
})

React.renderComponent(<div>Hello, haters!</div>, document.getElementById('container'));


// d3

