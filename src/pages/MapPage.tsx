import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'

import { getRegionName } from '../data/regions'
import { useFarms } from '../hooks/useFarms'
import { useProducerGroups } from '../hooks/useProducerGroups'

L.Icon.Default.mergeOptions({ iconUrl, iconRetinaUrl, shadowUrl })

const mapCenter: [number, number] = [8.74, -82.39]

function formatAltitudeRange(min: number, max: number): string {
  return `${min.toLocaleString()} – ${max.toLocaleString()} MASL`
}

export default function MapPage() {
  const farms = useFarms()
  const producerGroups = useProducerGroups()
  const producerGroupsById = useMemo(
    () => new Map(producerGroups.map((group) => [group.id, group])),
    [producerGroups],
  )
  const markerFarms = useMemo(
    () => farms.filter((farm) => farm.coordinates.lat !== 0 && farm.coordinates.lng !== 0),
    [farms],
  )

  return (
    <section className="relative h-[calc(100dvh-64px)] min-h-[calc(100dvh-64px)]">
      <div className="pointer-events-none absolute left-3 right-3 top-3 z-[500] rounded-2xl bg-white/95 p-4 shadow-lg ring-1 ring-neutral-200 backdrop-blur dark:bg-neutral-900/95 dark:ring-neutral-800 sm:left-4 sm:right-auto sm:top-4 sm:max-w-sm">
        <h1 className="text-base font-semibold text-neutral-900 sm:text-lg dark:text-white">Panama coffee map</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
          Explore farm locations across Chiriquí and jump into detail pages from each marker.
        </p>
        <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
          Showing {markerFarms.length} of {farms.length} farms with coordinates
        </p>
      </div>

      <MapContainer center={mapCenter} zoom={10} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {markerFarms.map((farm) => {
          const producerGroup = producerGroupsById.get(farm.producerGroupId)

          return (
            <Marker key={farm.id} position={[farm.coordinates.lat, farm.coordinates.lng]}>
              <Popup>
                <div className="space-y-2">
                  <div>
                    <p className="font-semibold">{farm.name}</p>
                    <p className="text-sm text-neutral-600">{producerGroup?.name ?? 'Unknown producer'}</p>
                    <p className="text-sm text-neutral-600">{getRegionName(farm.region)}</p>
                    <p className="text-sm text-neutral-600">
                      {formatAltitudeRange(farm.altitude.minMASL, farm.altitude.maxMASL)}
                    </p>
                  </div>
                  <Link to={`/farms/${farm.slug}`} className="text-sm font-semibold text-coffee-700">
                    View farm →
                  </Link>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </section>
  )
}
