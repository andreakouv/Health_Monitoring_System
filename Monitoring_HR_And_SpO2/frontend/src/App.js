import React, { Component } from 'react';
import { Header } from "./global/header";
import { BrowserRouter, Switch, Route } from "react-router-dom";
import Panel from "./main/Table";
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css';


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      data: []
    };
  }
  render() {
    return(
      <div className="App">
        <BrowserRouter>
        <Header />
        <Switch>
          <Route exact path="/" component={Panel} />
          {/* <Route path="/Chart" component={Chartsss} /> */}
        </Switch>
        </BrowserRouter>
      </div>
    );
  }
}

export default App;
