'use client'

import { useState } from 'react'

interface Element {
  id: string
  type: 'rect' | 'text'
  x: number
  y: number
  width: number
  height: number
  text?: string
}

export default function Canvas() {
  const [elements, setElements] = useState<Element[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const addElement = (type: 'rect' | 'text') => {
    const newElement: Element = {
      id: Date.now().toString(),
      type,
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      text: type === 'text' ? 'Hello' : undefined,
    }
    setElements([...elements, newElement])
  }

  return (
      <div className="flex-1 bg-gray-50 relative overflow-hidden">
        <svg
          className="w-full h-full"
          onClick={() => setSelectedId(null)}
        >
          {elements.map((el) => (
            <g key={el.id}>
              {el.type === 'rect' && (
                <rect
                    x={el.x}
                    y={el.y}
                    width={el.width}
                    height={el.height}
                    fill="blue"
                    stroke={selectedId === el.id ? 'red' : 'black'}
                    strokeWidth="2"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedId(el.id)
                    }}
                />
              )}
              {el.type === 'text' && (
                <text
                  x={el.x}
                  y={el.y + 20}
                  fontSize="16"
                  fill="black"
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedId(el.id)
                  }}
                  className="canvas-cursor-pointer"
                >
                  {el.text}
                </text>
              )}
            </g>
          ))}

        </svg>

        {/* Simple controls */}
        <div className="absolute top-4 right-4 space-x-2">
          <button
            onClick={() => addElement('rect')}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Add Rect
          </button>
          <button
            onClick={() => addElement('text')}
            className="px-3 py-1 bg-green-500 text-white rounded"
          >
            Add Text
          </button>
        </div>
      </div>
  );
}