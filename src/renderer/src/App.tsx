import {
  AppShell,
  Button,
  Code,
  Fieldset,
  Flex,
  Grid,
  Group,
  LoadingOverlay,
  MultiSelect,
  Paper,
  Progress,
  Space,
  Stack
} from '@mantine/core'
import React, { useEffect, useMemo, useState } from 'react'
import {
  ReadInputBarcodeFormat,
  barcodeFormats,
  readBarcodesFromImageData,
  setZXingModuleOverrides,
  type ReaderOptions
} from 'zxing-wasm/full'
import zxingwasmfile from '../../../resources/zxing_full.wasm?url'
import ImageTile, { ImageTileProps } from './components/ImageTile/ImageTile'
import createImageDataFromFile from './utils/createImageDataFromFile'

interface BarcodeData {
  idValid: boolean
  format: string
  text: string
}

interface OutputData {
  file: string
  barcodes: BarcodeData[]
}

const BarcodeReader: React.FC = () => {
  const [selectedDirectory, setSelectedDirectory] = useState<{
    path: string
    files: string[]
  }>({
    path: '',
    files: []
  })
  const [selectedFormats, setSelectedFormats] = useState<ReadInputBarcodeFormat[]>(['QRCode'])
  const [processedImages, setProcessedImages] = useState<ImageTileProps[] | null>(null)
  const [output, setOutput] = useState<OutputData[]>([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (window as any).api

  // override the locateFile function
  setZXingModuleOverrides({
    locateFile: (path, prefix) => {
      if (path.endsWith('.wasm')) {
        // Use the wasm file from the Electron Vite resources directory
        console.log(zxingwasmfile)
        return zxingwasmfile
      }
      return prefix + path
    }
  })
  const readerOptions: ReaderOptions = {
    isPure: false,
    tryHarder: true,
    formats: selectedFormats,
    maxNumberOfSymbols: 255,
    returnErrors: true,
    downscaleThreshold: 500,
    downscaleFactor: 2
  }

  const downloadOutput = (): void => {
    const data = JSON.stringify(output, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'output.json' // Replace this with the actual filename you want
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleScan = async (): Promise<void> => {
    if (!selectedDirectory.path) return

    setProcessedImages(null)
    setOutput([])
    setLoading(true)

    const newOutput: OutputData[] = []

    const totalFiles = selectedDirectory.files.length
    let count = 0
    setProgress(1)

    try {
      for (const file of selectedDirectory.files) {
        count++
        setProgress((count / totalFiles) * 100)

        const imagePath = `${selectedDirectory.path}/${file}` // Adjust path joining as needed
        const imageFile: File = await api.readFile(imagePath)
        const imageData = await createImageDataFromFile(imageFile)

        // Read the barcode data with the first binarizer
        const readerOptions1: ReaderOptions = { ...readerOptions, binarizer: 'LocalAverage' }
        const barcodeData1 = await readBarcodesFromImageData(imageData, readerOptions1)

        // Read the barcode data with the second binarizer
        const readerOptions2: ReaderOptions = { ...readerOptions, binarizer: 'GlobalHistogram' }
        const barcodeData2 = await readBarcodesFromImageData(imageData, readerOptions2)

        // the barcodes have an isValid field that can be used to find which binarizer was more successful
        const barcodeData = barcodeData1.filter((data) => data.isValid).length
          ? barcodeData1
          : barcodeData2

        // add the image data to the processed images
        if (barcodeData.length > 0) {
          setProcessedImages((prev) => [
            ...(prev || []),
            {
              title: file,
              imageData,
              barcodeData
            }
          ])

          // add the barcode data to the newOutput
          newOutput.push({
            file,
            barcodes: barcodeData.map((data) => ({
              idValid: data.isValid,
              format: data.format,
              text: data.text
            }))
          })
        } else {
          setProcessedImages((prev) => [
            ...(prev || []),
            {
              title: file,
              imageData,
              barcodeData: []
            }
          ])
          newOutput.push({
            file,
            barcodes: []
          })
        }
      }
    } catch (error) {
      console.error('Failed to read the image file', error)
    } finally {
      setProgress(0)
      setOutput(newOutput)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (loading) {
      document.body.classList.add('no-scroll')
    } else {
      document.body.classList.remove('no-scroll')
    }
  }, [loading])

  const imageTiles = useMemo(() => {
    return processedImages?.map((data) => (
      <ImageTile
        key={data.title}
        title={data.title}
        imageData={data.imageData}
        barcodeData={data.barcodeData}
      />
    ))
  }, [processedImages])

  return (
    <AppShell padding="md">
      <AppShell.Main>
        <Grid grow gutter="xs">
          <LoadingOverlay
            visible={loading}
            overlayProps={{ radius: 'sm', blur: 2 }}
            loaderProps={{
              children: (
                <Stack miw={300}>
                  <Progress radius="xl" size="md" value={progress} striped animated />
                </Stack>
              )
            }}
          >
            test
          </LoadingOverlay>

          <Grid.Col span={1}>
            <Paper shadow="xl" withBorder p="xs">
              <Group justify="center">
                <h1>Barcode Scanner</h1>
              </Group>
              <Fieldset legend="Settings">
                <MultiSelect
                  label="Barcode Formats"
                  value={selectedFormats}
                  data={barcodeFormats}
                  required
                  onChange={(value) =>
                    setSelectedFormats(value.map((val) => val as ReadInputBarcodeFormat))
                  }
                />
                <Space h="xs" />
                <Group>
                  <Button
                    onClick={async () => {
                      const dir = await api.selectDirectory()
                      if (dir.path) {
                        setSelectedDirectory(dir)
                        setProcessedImages(null)
                        setOutput([])
                      }
                    }}
                  >
                    Select Directory
                  </Button>

                  <Code>{selectedDirectory.path && selectedDirectory.path}</Code>
                  <Code>{selectedDirectory.path && selectedDirectory.files.length + ' Files'}</Code>
                </Group>
                <Space h="xs" />
                <Group>
                  <Button
                    onClick={handleScan}
                    disabled={!selectedFormats.length || !selectedDirectory.path}
                  >
                    Scan
                  </Button>
                  <Button
                    onClick={downloadOutput}
                    disabled={!output.length}
                    variant="outline"
                    color="blue"
                  >
                    Save Output
                  </Button>
                </Group>
              </Fieldset>
            </Paper>
          </Grid.Col>
          <Grid.Col span={6}>
            <div id="image-tiles">
              <Flex
                mih={50}
                gap="md"
                justify="center"
                align="flex-start"
                direction="row"
                wrap="wrap"
                className={loading ? 'loading' : ''}
              >
                {imageTiles}
              </Flex>
            </div>
          </Grid.Col>
        </Grid>
      </AppShell.Main>
    </AppShell>
  )
}

export default BarcodeReader
