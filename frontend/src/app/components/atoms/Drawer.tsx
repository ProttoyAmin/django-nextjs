import React from 'react'

function Drawer(items: any[]) {
  return (
    <>
      {items.map((items, index) => {
        return (
          <div key={index} className='bg-white'>{items.name}</div>
        )
      })}
    </>
  )
}

export default Drawer