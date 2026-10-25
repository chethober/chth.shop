'use client'

import { BentoTile } from './bento-tile'
import { EarningsTile, FACTS, FactTile, SplitTile, StepsTile } from './collab-tiles'
import { JoinTile } from './join-tile'

export function CollabBento() {
  const [upfront, ip, exit, inventory] = FACTS

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <BentoTile index={0} className="col-span-2 lg:row-span-2">
        <EarningsTile />
      </BentoTile>
      <BentoTile index={1} className="col-span-2">
        <SplitTile />
      </BentoTile>
      <BentoTile index={2}>
        <FactTile {...upfront} />
      </BentoTile>
      <BentoTile index={3}>
        <FactTile {...ip} />
      </BentoTile>
      <BentoTile index={4} className="col-span-2">
        <StepsTile />
      </BentoTile>
      <BentoTile index={5}>
        <FactTile {...exit} />
      </BentoTile>
      <BentoTile index={6}>
        <FactTile {...inventory} />
      </BentoTile>
      <BentoTile index={7} className="col-span-2 lg:col-span-4">
        <JoinTile />
      </BentoTile>
    </div>
  )
}
