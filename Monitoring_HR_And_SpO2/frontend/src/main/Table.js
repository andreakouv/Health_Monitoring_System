import React, { Component } from 'react';
import { socket } from "../global/header";
import ReactHTMLTableToExcel from "react-html-table-to-excel";
import { Table, Container } from "reactstrap";
import  CanvasJSReact from '../canvas/canvasjs.react';
import Workbook from 'react-excel-workbook';
import "./Table.css";

var CanvasJSChart = CanvasJSReact.CanvasJSChart;
var updateInterval = 1000;
var dps1_1 = [];
var dps1_2 = [];
var dps2_1 = [];
var dps2_2 = [];
var dps3_1 = [];
var dps3_2 = [];
var dps4_1 = [];
var dps4_2 = [];
var xls_data = [];

class Panel extends Component {
    constructor() {
      super();
      this.updateChart = this.updateChart.bind(this);
      this.state = {
        bio_data: [],
        allData: [],
        perDevice: {},
        selection: 1
      };
    }

    
    getData = bioItems => {
      var allData = [...this.state.allData, bioItems];
      this.setState({ bio_data: bioItems, allData });
      this.getAllData(allData);
    };
    
    componentDidMount() {
      socket.on("get_data", this.getData);
      this.updateChart();
      setInterval(this.updateChart, updateInterval);
     };
  
    componentWillUnmount() {
      socket.off("get_data");
    };

    
    getAllData(all_d) {  
      var a = all_d.reduce((acc, item) => {
        for(var i in item) {
          if(!acc[item[i]._id]){
            acc[item[i]._id] = [];
          }
          var b = acc[item[i]._id];
          if( b.length === 0 || (b[b.length-1]._id !== item[i].meas._id ))
          {
            acc[item[i]._id].push(item[i].meas);
          }
        }
        return acc
      }, {});
      this.setState({perDevice: a});
    }
  
    getBioData() {
      let bio_data = this.state.bio_data.sort((a,b) => 
      (b.meas.hr
        .toString()
        .localeCompare(
          a.meas.hr,
          undefined, 
          {
            numeric: true,
            sensitivity: 'base'
          }
          )));

        return bio_data.map(({ meas }) => {
          return (
          <tr key = {meas._id}>
            <td> {meas.userId} </td>
            <td> {meas.hr} </td>
            <td> {meas.spo2} </td>
            <td> {meas.time} </td> 
          </tr>
          );
        });
      };

    updateChart(){

      
      dps1_1 = this.state.perDevice[1] && this.state.perDevice[1].map((d) => {
        let n_time=d.time.slice(11);
        return { y: parseInt(d.hr), label :n_time }
      });

      dps1_2 = this.state.perDevice[1] && this.state.perDevice[1].map((c) => {
        let n_time=c.time.slice(11);
        return { y: parseInt(c.spo2), label :n_time };
      });
       
     
      
      dps2_1 = this.state.perDevice[2] && this.state.perDevice[2].map((d) => {
        let n_time=d.time.slice(11);
        return { y: parseInt(d.hr), label :n_time }
      });
     
      dps2_2 = this.state.perDevice[2] && this.state.perDevice[2].map((c) => {
        let n_time=c.time.slice(11);
        return { y: parseInt(c.spo2), label :n_time };
      });

      
      dps3_1 = this.state.perDevice[3] && this.state.perDevice[3].map((d) => {
        let n_time=d.time.slice(11);
        return { y: parseInt(d.hr), label :n_time }
      });
      
      dps3_2 = this.state.perDevice[3] && this.state.perDevice[3].map((c) => {
        let n_time=c.time.slice(11);
        return { y: parseInt(c.spo2), label :n_time };
      });
    
     
     
      dps4_1 = this.state.perDevice[4] && this.state.perDevice[4].map((d) => {
        let n_time=d.time.slice(11);
        return { y: parseInt(d.hr), label :n_time }
      });
     
      dps4_2 = this.state.perDevice[4] && this.state.perDevice[4].map((c) => {
        let n_time=c.time.slice(11);
        return { y: parseInt(c.spo2), label :n_time };
      });
     
      this.chart.render();
    }
  
    

    clearDatabase() {
      socket.emit("clear_db");
    };

    clearUser1(){
      socket.emit("clear_user1");  
    };

    clearUser2(){
      socket.emit("clear_user2");
    };

    clearUser3(){
      socket.emit("clear_user3");
    };

    clearUser4(){
      socket.emit("clear_user4");
    };

    clearUser5(){
      socket.emit("clear_user5");
    };

    render() {
      const options1 = { 
        animationEnabled: true,
        title:{
          text: "HR and SPO2 of User 1"
        },
        theme: "light1",
        exportEnabled: true,
        axisY : {
          includeZero: false
        },
        data: [{
          type: "spline",
          name: "HR",
          showInLegend: true,
          dataPoints: dps1_1
        },
        {
          type: "spline",
          name: "SpO2",
          showInLegend: true,
          dataPoints: dps1_2
        }]
      }
      const options2 = { 
        animationEnabled: true,
        title:{
          text: "HR and SPO2 of User 2"
        },
        theme: "light1",
        exportEnabled: true,
        axisY : {
          includeZero: false
        },
        data: [{
          type: "spline",
          name: "HR",
          showInLegend: true,
          dataPoints: dps2_1
        },
        {
          type: "spline",
          name: "SpO2",
          showInLegend: true,
          dataPoints: dps2_2
        }]
      }
      const options3 = { 
        animationEnabled: true,
        title:{
          text: "HR and SPO2 of User 3"
        },
        theme: "light1",
        exportEnabled: true,
        axisY : {
          includeZero: false
        },
        data: [{
          type: "spline",
          name: "HR",
          showInLegend: true,
          dataPoints: dps3_1
        },
        {
          type: "spline",
          name: "SpO2",
          showInLegend: true,
          dataPoints: dps3_2
        }]
      }
      const options4 = { 
        animationEnabled: true,
        title:{
          text: "HR and SPO2 of User 4"
        },
        theme: "light1",
        exportEnabled: true,
        axisY : {
          includeZero: false
        },
        data: [{
          type: "spline",
          name: "HR",
          showInLegend: true,
          dataPoints: dps4_1
        },
        {
          type: "spline",
          name: "SpO2",
          showInLegend: true,
          dataPoints: dps4_2
        }]
      }
      
      xls_data =  this.state.perDevice[this.state.selection] && this.state.perDevice[this.state.selection].map((x) => {
        return {
          Id : x.userId,
          Heart_Rate : x.hr,
          SpO2 : x.spo2,
          Time_measured : x.time
        }
      });
      
      return (
      <Container>
        <ReactHTMLTableToExcel
        id="test-table-xls-button"
        className="download-table-xls-button"
        table="table-to-xls"
        filename="tablexls"
        sheet="tablexls"
        buttonText="Download current table as XLS" 
        />
        <Table striped id="table-to-xls">
          <thead>
            <tr>
              <th>ID</th>
              <th>HR</th>
              <th>SPO2</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>{this.getBioData()}</tbody>
          </Table>
          <div className = 'excel_wrapper'>
          <div className = "select_wrapper">
          <select onChange={(e) => this.setState({selection:e.target.value})}>
              <option value ="1">User 1</option>
              <option value ="2">User 2</option>
              <option value ="3">User 3</option>
              <option value ="4">User 4</option>
          </select><br/>
         
          </div>
            <div className="row text-center" style= {{margiTop: '20px'}}>
            <Workbook filename="Bio_Data.xlsx" element={<button className="xlsx_btn" id="xl_but">Download Medical History</button>}>
              <Workbook.Sheet data={xls_data} name="Bio Sheet">
                <Workbook.Column label="User Id" value="Id"/>
                <Workbook.Column label="Heart Rate" value="Heart_Rate"/>
                <Workbook.Column label="SpO2" value="SpO2"/>
                <Workbook.Column label="Time" value="Time_measured"/>
              </Workbook.Sheet>
            </Workbook>
            </div><br/>
            </div> <br/>  
        
                  <div className = "charts_wrapper1">

                  <div className="charts1" style = {{marginTop: '20px'}}>
                  <CanvasJSChart options = {options1}
                  onRef={ref => this.chart = ref}
                  /></div>

                  <div className="charts2" style = {{marginTop: '20px'}}>   
                  <CanvasJSChart options = {options2}
                  onRef={ref => this.chart = ref}
                  /></div>
                  </div>

                  <div className = "charts_wrapper2">

                  <div className="charts3" style = {{marginTop: '20px'}}>
                  <CanvasJSChart options = {options3}
                  onRef={ref => this.chart = ref}
                  /></div>

                  <div className="charts4" style = {{marginTop: '20px'}}>   
                  <CanvasJSChart options = {options4}
                  onRef={ref => this.chart = ref}
                  /></div>

                  </div>
                  <div className="allButtons" id="clear">
                  <div id="all_text">To delete Data from all users :</div>
                  <button id="clear_all" onClick={() => this.clearDatabase() }>
                    Delete All</button>
                    <div id="users_text">Or else select the data you wish to delete:</div>
                    <div className="userButtons" id="clear">
                      <button id="clear1" onClick={() => this.clearUser1() }>
                        User 1</button>
                      <button id="clear2" onClick={() => this.clearUser2() }>
                        User 2</button>
                      <button id ="clear3" onClick={() => this.clearUser3() }>
                        User 3</button>
                      <button id= "clear 4" onClick={() => this.clearUser4() }>
                        User 4</button>
                        
                        </div>
                        <br/>
                        <br/>
                        </div>
                  </Container>
                  );
                }
              }
export default Panel;
  
  