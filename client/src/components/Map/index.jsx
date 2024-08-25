import React from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import Routing from './Routing'

const Map = ({from, to}) => {

    return (
        // Make sure you set the height and width of the map container otherwise the map won't show
        <MapContainer
            center={[from.lat, from.lon]}
            zoom={8}
            style={{ height: "22rem" }}
            maxZoom={18}
            minZoom={8}
        >
            <Routing
                position={'topright'}
                start={[from.lat, from.lon]}
                end={[to.lat, to.lon]}
                color={"#512DA8"}
            />

            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[from.lat, from.lon]}>
                <Popup>{from.address}</Popup>
            </Marker>

            <Marker position={[to.lat, to.lon]}>
                <Popup>{to.address}</Popup>
            </Marker>
        </MapContainer>
    );
}

export default Map;