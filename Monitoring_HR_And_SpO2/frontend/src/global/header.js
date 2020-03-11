import React, { Component } from "react";
import { NavLink } from "react-router-dom";
import socketIOClient from "socket.io-client";
import "./header.css";

var socket;
class Header extends Component {
  constructor() {
    super();
    this.state = {
      endpoint: "http://localhost:3001/" // Update 3001 with port on which backend-my-app/server.js is running.
    };

    socket = socketIOClient(this.state.endpoint);
  }

  render() {
      return(
        <header>
            <nav>
                <ul className="NavClass">
                    <li>
                        <NavLink exact to="/">
                        Monitoring Table for Emergency Department
                        </NavLink>
                    </li>
                   {/* <li>
                        <NavLink to="/Chart">
                            Biomedical Chart
                        </NavLink>
                    </li> */}
                </ul>
            </nav>
        </header>
        );
  }
}
export {Header, socket };