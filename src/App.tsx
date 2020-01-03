import React, { Component, createRef } from 'react';
import './App.css';
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import 'leaflet-easybutton/src/easy-button.css'
import 'leaflet-easybutton'
import keys from './keys'
import Login from './Login'
import EditItem from './EditItem'
import Item from './Item';

const html$ = import('htm').then(({default: htm}) => import('hyperscript').then(({default: hyperscript}) => htm.bind(hyperscript)))
const firebase$ = import('firebase/app').then(({default: firebase}) => {
  firebase.initializeApp(keys)
  return Promise.all([import('firebase/auth'), import('firebase/firestore')]).then(() => firebase)
})
const auth$ = firebase$.then(f => f.auth())
const firestore$ = firebase$.then(f => f.firestore()).then(firestore => firestore.enablePersistence({synchronizeTabs: true}).then(() => firestore))
const items$ = firestore$.then(firestore => firestore.collection("champignons"))

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
  editItem: Item & {id: string} | undefined;
  userid: string | undefined;
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
      newItem: false,
      editItem: undefined,
      userid: undefined
    }

    auth$.then(auth => auth.onAuthStateChanged(async user => {
      if (user) {
        this.setState({userid: user.uid})
        let items = await items$
        items.where("userid", "==", user.uid).onSnapshot(async snapshot => {
          let html = await html$
          snapshot.docChanges().forEach(change => {
            let remove = () => {
              this.mapItems.get(change.doc.id)!.marker.remove()
              this.mapItems.get(change.doc.id)!.circle.remove()
              this.mapItems.delete(change.doc.id)
            }
            let create = () => {
              let {latlng, accuracy, notes, type, count} = change.doc.data()
              let popup = html`<div>${type} (${count}): ${notes}<br/>
                <div className="fas fa-edit tool-icon" onclick=${() => this.setState({editItem: {id: change.doc.id, type, notes, count}})}/>
                <div className="fas fa-times tool-icon" onclick=${() => items.doc(change.doc.id).delete()}/>
              </div>`
              this.mapItems.set(change.doc.id, {
                marker: L.marker({lat: latlng.latitude, lng: latlng.longitude}, {icon}).addTo(this.map!).bindPopup(popup),
                circle: L.circle({lat: latlng.latitude, lng: latlng.longitude}, accuracy/2).addTo(this.map!)
              })
            }

            if (change.type === "added") {
              create()
            } else if (change.type === "modified") {
              remove()
              create()
            } else if (change.type === "removed") {
              remove()
            }
          });
        });
        }
    })
    )
  }

  mapItems = new Map<string, { marker: L.Marker, circle: L.Circle}>()
  mapRef = createRef<HTMLDivElement>()
  map: L.Map | undefined

  componentDidMount() {

    let googleHybrid = L.tileLayer('https://{s}.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}',{
      maxZoom: 21,
      subdomains:['mt0','mt1','mt2','mt3']
    });
    let googleSat = L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',{
      maxZoom: 21,
      subdomains:['mt0','mt1','mt2','mt3']
    });
    let googleMap = L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',{
      maxZoom: 21,
      subdomains:['mt0','mt1','mt2','mt3']
    });
    let GeoportailFrance_orthos = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=ORTHOIMAGERY.ORTHOPHOTOS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
      bounds: [[-75, -180], [81, 180]],
      minZoom: 2,
      maxZoom: 21,
      apikey: 'choisirgeoportail',
      format: 'image/jpeg',
      style: 'normal'
    } as any);
    let GeoportailFrance_parcels = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=CADASTRALPARCELS.PARCELS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
      bounds: [[-75, -180], [81, 180]],
      minZoom: 2,
      maxZoom: 21,
      maxNativeZoom: 20,
      apikey: 'choisirgeoportail',
      format: 'image/png',
      style: 'bdparcellaire'
    } as any);
    let GeoportailFrance_ignMaps = L.tileLayer('https://wxs.ign.fr/{apikey}/geoportail/wmts?REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0&STYLE={style}&TILEMATRIXSET=PM&FORMAT={format}&LAYER=GEOGRAPHICALGRIDSYSTEMS.MAPS&TILEMATRIX={z}&TILEROW={y}&TILECOL={x}', {
      bounds: [[-75, -180], [81, 180]],
      minZoom: 2,
      maxZoom: 21,
      maxNativeZoom: 18,
      apikey: 'choisirgeoportail',
      format: 'image/jpeg',
      style: 'normal',
      opacity: 0.5
    } as any);

    this.map = new L.Map(this.mapRef.current as HTMLElement, {
      layers: [googleHybrid]
    })

    L.control.layers({googleHybrid, googleSat, googleMap, GeoportailFrance_orthos}, {GeoportailFrance_ignMaps, GeoportailFrance_parcels}).addTo(this.map);

    let m : L.Marker | undefined,c : L.Circle | undefined
    this.map.on('locationfound', ( e : L.LeafletEvent) => {
      let last = e as L.LocationEvent
      this.setState({last})
      var radius = last.accuracy / 2;
      if (m === undefined) {
        m = L.marker(last.latlng, {icon}).addTo(this.map!)
        this.map!.setView(last.latlng, 42)
      } else {
        m.setLatLng(last.latlng)
      }
      m.bindPopup(Math.round(radius) + " <b>meters</b>" ,{ autoPan: false }).openPopup()
      if (c === undefined) {
        c = L.circle(last.latlng, radius).addTo(this.map!)
      } else {
        c.setLatLng(last.latlng)
        c.setRadius(radius)
      }
    });
    this.map.on('locationerror', console.error);
    this.map.locate({watch: true, enableHighAccuracy: true})

    this.map.on('click', (e : any) => {
      this.setState({last: {latlng: e.latlng, accuracy: 2}, newItem: true})
    })

    L.easyButton('fas fa-user', () => {
      this.setState({login: true})
    }).addTo(this.map);

    L.easyButton('fas fa-plus', () => {
      this.setState({newItem: true})
    }).addTo(this.map);

    L.easyButton('fas fa-crosshairs', () => {
      m && this.map!.setView(m.getLatLng(), 42)
    }).addTo(this.map);
  }

  async handleNewItem(last: any, item: Item) {
    this.setState({newItem: false});
    let { GeoPoint, Timestamp } = (await firebase$).firestore;
    (await items$).add({
      userid: this.state.userid,
      type: item.type,
      count: item.count,
      latlng: new GeoPoint(last.latlng.lat, last.latlng.lng),
      accuracy: last.accuracy,
      notes: item.notes,
      timestamp: new Timestamp(Math.round(Date.now()/1000), 0)
    })
  }

  async handleEditItem(id: string, item: Item) {
    this.setState({editItem: undefined});
    (await items$).doc(id).set({
      type: item.type,
      count: item.count,
      notes: item.notes
    }, { merge: true })
  }

  async handleLogin(email: string | undefined, password: string | undefined) {
    this.setState({login: false});
    if (email === undefined || password === undefined) return;
    let auth = await auth$
    auth.signInWithEmailAndPassword(email, password).catch(function(error) {
      if (error.code === 'auth/user-not-found') {
        auth.createUserWithEmailAndPassword(email, password).catch(console.error);
      } else {
        console.error(error)
      }
    });
  }

  render() {
    let login = this.state.login ? (<Login confirm={this.handleLogin.bind(this)} />) : null
    let newItem = this.state.newItem ? (<EditItem edit={false} item={{count: 1, type: 'cepe', notes: ''}} cancel={() => this.setState({newItem: false})} confirm={this.handleNewItem.bind(this, this.state.last)} />) : null
    let editItem = this.state.editItem ? (<EditItem edit item={this.state.editItem} cancel={() => this.setState({editItem: undefined})} confirm={this.handleEditItem.bind(this, this.state.editItem.id)} />) : null
    return (<div>
      {login}
      {newItem}
      {editItem}
      <div ref={this.mapRef} id="mapid" />
    </div>)
  }
}

