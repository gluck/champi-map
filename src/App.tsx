import React, { Component, createRef } from 'react';
import './App.css';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import 'leaflet-easybutton/src/easy-button.css'
import 'leaflet-easybutton'
import secrets from './secrets'
import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import Login from './Login'
import EditItem from './EditItem'
import Item from './Item';

firebase.initializeApp(secrets)
let { GeoPoint, Timestamp } = firebase.firestore

let db = firebase.firestore()
let icon = L.divIcon({className: 'fas fa-times item-icon', iconSize: [20,20]})

interface Props {
}

interface State {
  login: boolean,
  hasLocation: boolean,
  logged: boolean;
  last: {
    latlng: {
      lat: number,
      lng: number,
    },
    accuracy: number;
  },
  newItem: boolean;
}


export default class App extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      logged: false,
      login: false,
      last: {
        latlng: {
          lat: 51.505,
          lng: -0.09
        },
        accuracy: 5
      },
      hasLocation: false,
      newItem: false
    }
    firebase.auth().onAuthStateChanged(user => {
      if (user) {
        db.collection("champignons").where("userid", "==", user.uid).onSnapshot(snapshot => {
          snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
              console.log(change.doc.data())
              let {latlng, accuracy, notes, type, count} = change.doc.data()
              this.mapItems.set(change.doc.id, {
                marker: L.marker({lat: latlng.latitude, lng: latlng.longitude}, {icon}).addTo(this.map!).bindPopup(`${type} (${count}): ${notes}`),
                circle: L.circle({lat: latlng.latitude, lng: latlng.longitude}, accuracy/2).addTo(this.map!)
              })
            } else if (change.type === "modified") {
              let {latlng, accuracy, notes, type, count} = change.doc.data()
              this.mapItems.get(change.doc.id)!.marker.remove()
              this.mapItems.get(change.doc.id)!.circle.remove()
              this.mapItems.set(change.doc.id, {
                marker: L.marker({lat: latlng.latitude, lng: latlng.longitude}, {icon}).addTo(this.map!).bindPopup(`${type} (${count}): ${notes}`),
                circle: L.circle({lat: latlng.latitude, lng: latlng.longitude}, accuracy/2).addTo(this.map!)
              })
            } else if (change.type === "removed") {
              this.mapItems.get(change.doc.id)!.marker.remove()
              this.mapItems.get(change.doc.id)!.circle.remove()
              this.mapItems.delete(change.doc.id)
            }
          });
        });
        }
    })
  }

  mapItems = new Map<string, { marker: L.Marker, circle: L.Circle}>()
  mapRef = createRef<HTMLDivElement>()
  map: L.Map | undefined

  componentDidMount() {

    this.map = new L.Map(this.mapRef.current as HTMLElement, {
    })

    let m : L.Marker,c : L.Circle
    this.map.on('locationfound', ( e : L.LeafletEvent) => {
      let last = e as L.LocationEvent
      this.setState({last})
      var radius = last.accuracy / 2;
      if (m === undefined) {
        m = L.marker(last.latlng, {icon}).addTo(this.map!)
      } else {
        m.setLatLng(last.latlng)
      }
      m.bindPopup(radius + " <b>meters</b>").openPopup()
      if (c == undefined) {
        c = L.circle(last.latlng, radius).addTo(this.map!)
      } else {
        c.setLatLng(last.latlng)
        c.setRadius(radius)
      }
    });
    this.map.on('locationerror', console.error);
    this.map.locate({watch: true, setView: true, enableHighAccuracy: true})
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {}).addTo(this.map);

    L.easyButton('fas fa-user', (btn, map) => {
      this.setState({login: true})
    }).addTo(this.map);

    L.easyButton('fas fa-plus', (btn, map) => {
      this.setState({newItem: true})
    }).addTo(this.map);
  }

  handleNewItem(last: any, item: Item) {
    this.setState({newItem: false});
    db.collection("champignons").add({
      userid: firebase.auth().currentUser!.uid,
      type: item.type,
      count: item.count,
      latlng: new GeoPoint(last.latlng.lat, last.latlng.lng),
      accuracy: last.accuracy,
      notes: item.notes,
      timestamp: new Timestamp(Math.round(Date.now()/1000), 0)
    })
  }


  handleLogin(email: string | undefined, password: string | undefined) {
    this.setState({login: false});
    if (email === undefined || password === undefined) return;
    firebase.auth().signInWithEmailAndPassword(email, password).catch(function(error) {
      if (error.code === 'auth/user-not-found') {
        firebase.auth().createUserWithEmailAndPassword(email, password).catch(console.error);
      } else {
        console.error(error)
      }
    });
  }

  render() {
    let login = this.state.login ? (<Login confirm={this.handleLogin.bind(this)} />) : null
    let newItem = this.state.newItem ? (<EditItem item={{count: 1, type: 'cepe', notes: ''}} cancel={() => this.setState({newItem: false})} confirm={this.handleNewItem.bind(this, this.state.last)} />) : null
    return (<div>{login}{newItem}<div ref={this.mapRef} id="mapid" style={{ height: '100vh',
      width: '100vw'}}></div></div>)
  }
}

