import { Center, Code, Grid, Modal, Text, Table } from '@mantine/core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ReadResult } from 'zxing-wasm/full'
import './ImageTile.css'
import resizeImageData from '@renderer/utils/resizeImageData'

export interface ImageTileProps {
  title: string
  imageData: ImageData
  barcodeData: ReadResult[]
}

const drawBarcodes = (
  barcode: ReadResult,
  ctx: CanvasRenderingContext2D,
  imageData: ImageData
): void => {
  const fontSize = imageData.width / 40
  ctx.font = `${fontSize}px sans-serif`
  const { bottomLeft, bottomRight, topLeft, topRight } = barcode.position
  const lowestY = Math.max(bottomLeft.y, bottomRight.y, topLeft.y, topRight.y)

  const hadError = !barcode.isValid
  const info = {
    text: hadError ? `${barcode.error}` : `${barcode.format}: ${barcode.text}`,
    primaryColor: hadError ? 'red' : 'green',
    secondaryColor: 'white'
  }

  ctx.lineWidth = 5
  ctx.strokeStyle = info.primaryColor
  ctx.beginPath()
  ctx.moveTo(topLeft.x, topLeft.y)
  ctx.lineTo(topRight.x, topRight.y)
  ctx.lineTo(bottomRight.x, bottomRight.y)
  ctx.lineTo(bottomLeft.x, bottomLeft.y)
  ctx.closePath()
  ctx.stroke()

  const textMetrics = ctx.measureText(info.text)
  const centerX = (topLeft.x + topRight.x) / 2
  const textX = centerX - textMetrics.width / 2

  ctx.fillStyle = info.secondaryColor
  ctx.fillRect(textX, lowestY + 1, textMetrics.width, fontSize + 1)

  ctx.fillStyle = info.primaryColor
  ctx.fillText(info.text, textX, lowestY + fontSize)
}

function ImageTile({ title, imageData, barcodeData }: ImageTileProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const fullImageCanvasRef = useRef<HTMLCanvasElement>(null)

  const hasInvalidData = barcodeData.length === 0 || barcodeData.some((data) => !data.isValid)

  // Use useCallback to memoize the draw function
  const drawOnCanvas = useCallback(
    async (canvas: HTMLCanvasElement | null, preview: boolean, failure?: boolean) => {
      if (!canvas) {
        console.error('Canvas is not available')
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        console.error('Unable to get canvas context')
        return
      }

      try {
        const targetImageData = preview ? await resizeImageData(imageData, 128, 128) : imageData
        canvas.width = targetImageData.width
        canvas.height = targetImageData.height

        ctx.putImageData(targetImageData, 0, 0)

        if (preview) {
          ctx.fillStyle = failure ? 'rgba(255, 0, 0, 0.2)' : 'rgba(0, 255, 0, 0.2)'
          ctx.fillRect(0, 0, targetImageData.width, targetImageData.height)
        } else {
          // Assuming barcodeData is an iterable collection of data needed to draw barcodes
          barcodeData.forEach((data) => {
            drawBarcodes(data, ctx, imageData)
          })
        }
      } catch (error) {
        console.error('Error drawing on canvas:', error)
      }
    },
    [imageData, barcodeData] // Ensure these dependencies are correctly defined and passed
  )

  useEffect(() => {
    drawOnCanvas(previewCanvasRef.current, true, hasInvalidData)
  }, [drawOnCanvas])

  useEffect(() => {
    if (open) {
      // Ensure the modal is open before drawing
      const handle = requestAnimationFrame(() => {
        if (fullImageCanvasRef.current) {
          drawOnCanvas(fullImageCanvasRef.current, false)
        } else {
          console.error('Canvas is not available, trying again')
          // wait 2 seconds and try again
          setTimeout(() => {
            if (fullImageCanvasRef.current) {
              drawOnCanvas(fullImageCanvasRef.current, false)
            }
          }, 500)
        }
      })
      return () => cancelAnimationFrame(handle)
    } else {
      return undefined
    }
  }, [open, drawOnCanvas])

  const rows = barcodeData.map((barcode) => (
    <Table.Tr key={barcode.orientation}>
      <Table.Td>{barcode.isValid ? 'Yes' : 'No'}</Table.Td>
      <Table.Td>{barcode.format}</Table.Td>
      <Table.Td>
        {barcode.isValid ? <Text maw={300}>{barcode.text}</Text> : <Code>{barcode.error}</Code>}
      </Table.Td>
    </Table.Tr>
  ))

  const modalContent = open && (
    <Grid>
      <Grid.Col span={6}>
        <Center>
          <canvas id="image-full" ref={fullImageCanvasRef} />
        </Center>
      </Grid.Col>
      <Grid.Col span={6}>
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Valid</Table.Th>
              <Table.Th>Format</Table.Th>
              <Table.Th>Content</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </Grid.Col>
    </Grid>
  )

  return (
    <div key={title}>
      <Modal opened={open} onClose={() => setOpen(false)} title={title} size="auto">
        {modalContent}
      </Modal>
      <canvas
        id="image-preview"
        style={{ cursor: 'pointer' }}
        className={`${hasInvalidData ? 'imagetile-invalid' : 'imagetile-valid'}`}
        ref={previewCanvasRef}
        onClick={() => setOpen(true)}
      />
    </div>
  )
}

export default ImageTile
