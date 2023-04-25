/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Button, Window } from '@magickml/client-core'
import Editor from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import '../../screens/Magick/magick.module.css'
import WindowMessage from '../../components/WindowMessage'
import { TextEditorData, useInspector } from '../../contexts/InspectorProvider'
import { complete, generate } from './utils'

const TextEditor = props => {
  const [code, setCodeState] = useState<string | undefined>(undefined)
  const [data, setData] = useState<TextEditorData | null>(null)
  const [editorOptions, setEditorOptions] = useState<Record<string, any>>({
    wordWrap: 'on',
    minimap: { enabled: false },
  })
  const codeRef = useRef<string>()
  const [openaiApiKey, setOpenaiApiKey] = useState<string | undefined>(
    undefined
  )

  const { textEditorData, saveTextEditor, inspectorData } = useInspector()

  const [lastInputs, setLastInputs] = useState<string>('')

  useEffect(() => {
    const secrets = localStorage.getItem('secrets')
    if (secrets) {
      const parsedSecrets = JSON.parse(secrets)
      setOpenaiApiKey(parsedSecrets['openai_api_key'])
    }
  }, [])

  // const bottomHeight = 50
  const handleEditorWillMount = monaco => {
    monaco.editor.defineTheme('sds-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      wordWrap: true,
      colors: {
        'editor.background': '#272727',
      },
    })
  }

  useEffect(() => {
    if (!inspectorData?.data.inputs) {
      if (Object.keys(textEditorData).length !== 0) setCode(textEditorData.data)
      return
    }
    const { language } = textEditorData.options || ('javascript' as any)

    const stringifiedInputs = JSON.stringify(inspectorData?.data.inputs)

    // if inspectorData?.data.inputs is the same as lastInputs, then return
    if (stringifiedInputs === lastInputs) return
    setLastInputs(JSON.stringify(inspectorData?.data.inputs))

    const inputs: string[] = []
    const textLines = textEditorData.data?.split('\n') ?? []
    ;(inspectorData?.data.inputs as any).forEach((input: any) => {
      inputs.push('  ' + input.socketKey + ',')
    })

    // get the index of the first line that starts with function
    const startIndex = textLines.findIndex(line => line.startsWith('function'))
    // get the first line that starts with }
    const endIndex = textLines.findIndex(line => line.startsWith('}'))

    if (startIndex === -1 || endIndex === -1) return

    // remove the lines in textLines starting at StartIndex and ending at EndIndex
    // replace with the inputs
    textLines.splice(startIndex + 1, endIndex - startIndex - 1, ...inputs)

    // join the textLines array back into a string
    const updatedText = textLines.join('\n')
    const newTextEditorData = {
      ...textEditorData,
    }
    if (language === 'javascript' || language === 'python') {
      newTextEditorData.data = updatedText
    }

    setData(newTextEditorData)
    setCode(updatedText)
  }, [inspectorData, textEditorData])

  // useEffect(() => {
  //   if (code === textEditorData?.data && !code) return
  //   const delayDebounce = setTimeout(() => {
  //     save(code)
  //   }, 3000)

  //   return () => clearTimeout(delayDebounce)
  // }, [code])

  const save = code => {
    const update = {
      ...data,
      data: code,
    }
    setData(update)
    saveTextEditor(update)
  }

  const onSave = () => {
    save(codeRef.current)
  }

  const onComplete = () => {
    updateCode(complete(codeRef.current, openaiApiKey))
  }

  const onGenerate = () => {
    setCode(generate(textEditorData, openaiApiKey))
  }

  const updateCode = rawCode => {
    const code = rawCode.replace('\r\n', '\n')
    setCode(code)
    const update = {
      ...data,
      data: code,
    }
    setData(update)
  }

  const setCode = update => {
    setCodeState(update)
    codeRef.current = update
  }

  const toolbar = (
    <>
      <div style={{ flex: 1, marginTop: 'var(--c1)' }}>
        {textEditorData?.name && textEditorData?.name}
      </div>
      <Button onClick={onComplete}>COMPLETE</Button>
      <Button onClick={onGenerate}>GENERATE</Button>
      <Button onClick={onSave}>SAVE</Button>
    </>
  )

  if (!textEditorData?.control)
    return <WindowMessage content="Select a node with a text field" />

  return (
    <Window key={inspectorData?.nodeId} toolbar={toolbar}>
      {code && (
        <Editor
          theme="sds-dark"
          // height={height} // This seemed to have been causing issues.
          language={textEditorData?.options?.language}
          value={code}
          options={editorOptions}
          defaultValue={code}
          onChange={updateCode}
          beforeMount={handleEditorWillMount}
        />
      )}
    </Window>
  )
}

export default TextEditor
