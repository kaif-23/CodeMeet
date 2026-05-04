import React, { useEffect, useRef, useState } from "react";
import "codemirror/mode/javascript/javascript";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import "codemirror/lib/codemirror.css";
import CodeMirror from "codemirror";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import toast, { Toaster } from "react-hot-toast";
import { Play } from "lucide-react";
import { executeCode } from "./ExecuteCode";
import {
  LANGUAGE_VERSIONS,
  CODE_SNIPPETS,
  LANGUAGE_MODES,
} from "../constants/constant";


function Editor({ socket, roomId, onCodeChange, isVisible }) {
  const editorRef = useRef(null);
  const textareaRef = useRef(null);
  const codeRef = useRef("");
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");

  const [output, setOutput] = useState("your code output comes here...");
  useEffect(() => {
    if (editorRef.current) {
      // If editor already exists, don't reinitialize
      return;
    }

    async function init() {
      editorRef.current = CodeMirror.fromTextArea(textareaRef.current, {
        mode: { name: "javascript", json: true },
        theme: "dracula",
        autoCloseBrackets: true,
        autoCloseTags: true,
        autocorrect: true,
        lineNumbers: true,
      });

      // Set size after initialization
      editorRef.current.setSize("100%", "100%");
      editorRef.current.setValue(CODE_SNIPPETS[selectedLanguage]);
      codeRef.current = CODE_SNIPPETS[selectedLanguage];

      // Set up change handler
      editorRef.current.on("change", (instance, changes) => {
        const { origin } = changes;
        if (origin !== "setValue") {
          const currentCode = instance.getValue();
          codeRef.current = currentCode;
          console.log(currentCode);
          onCodeChange(currentCode);
          socket.emit("code:change", { roomId, code: currentCode });
        }
      });
    }

    init();

    // Cleanup function
    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea();
        editorRef.current = null;
      }
    };
  }, []); // Empty dependency array since we want to initialize only once

  useEffect(() => {
    if (!editorRef.current || !isVisible) return;
    const timer = setTimeout(() => {
      editorRef.current.refresh();
    }, 60);
    return () => clearTimeout(timer);
  }, [isVisible]);

  // Separate useEffect for socket event listeners
  useEffect(() => {
    const handleCodeChange = ({ code: payloadCode }) => {
      if (editorRef.current && payloadCode) {
        editorRef.current.setValue(payloadCode);
        codeRef.current = payloadCode;
      }
    };

    const handleDisconnect = ({ socketId, email }) => {
      toast.success(`${email} disconnected`);
    };

    socket.on("output", ({ output }) => {
      setOutput(output);
    });

    // Set up socket listeners
    socket.on("code:change", handleCodeChange);
    socket.on("disconnected", handleDisconnect);

    // Cleanup socket listeners
    return () => {
      socket.off("code:change", handleCodeChange);
      socket.off("disconnected", handleDisconnect);
      socket.off("output");
    };
  }, [socket]);
  const handleExecuteCode = async () => {
    try {
      const result = await executeCode({
        language: selectedLanguage,
        sourceCode: codeRef.current,
      });
      console.log("Execution result:", result);
      //setting output
      setOutput(result.run.output);
      socket.emit("output", {
        roomId,
        output: result.run.output,
      });

      // Handle the result (maybe show it in the UI)
    } catch (error) {
      toast.error("Failed to execute code: " + error.message);
      setOutput(error.message);
      socket.emit("output", {
        roomId,
        output: error.message,
      });
    }
  };

  useEffect(() => {
    const handleLanguageChange = ({ language, snippet }) => {
      if (LANGUAGE_MODES[language] && editorRef.current) {
        setSelectedLanguage(language);
        editorRef.current.setOption("mode", LANGUAGE_MODES[language]);
        editorRef.current.setValue(snippet);
        codeRef.current = snippet;
      }
    };

    socket.on("language:change", handleLanguageChange);
    return () => {
      socket.off("language:change", handleLanguageChange);
    };
  }, [socket]);

  const handleSelectLanguage = (event) => {
    const language = event.target.value;
    setSelectedLanguage(language);

    const mode = LANGUAGE_MODES[language];
    if (mode) {
      editorRef.current.setOption("mode", mode);
      editorRef.current.setValue(CODE_SNIPPETS[language]);
      codeRef.current = CODE_SNIPPETS[language];
      console.log("Mode set to:", mode);
      socket.emit("language:change", {
        roomId,
        language,
        snippet: CODE_SNIPPETS[language],
      });
    } else {
      console.error("Invalid mode for language:", language);
    }
  };
  // // Listen for language change events
  // useEffect(() => {


  //   return () => {
  //     socket.off("language:change", handleLanguageChange);
  //   };
  // }, [socket]);
  return (
    <div className="h-full w-full flex flex-col gap-3 min-h-0">
      <Toaster />
      <div className="flex-1 min-h-0 rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
        <textarea ref={textareaRef} className="h-full w-full" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-slate-300 text-sm">Language</label>
          <select
            value={selectedLanguage}
            onChange={handleSelectLanguage}
            className="bg-slate-800 text-slate-100 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {Object.keys(LANGUAGE_VERSIONS).map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <p className="text-slate-100 font-bold text-sm sm:text-base">Execute Code:</p>
          <button
            type="button"
            onClick={handleExecuteCode}
            className="bg-blue-600 text-white border border-blue-500 rounded-full p-2 shadow-lg shadow-blue-400/30 hover:bg-blue-700">
            <Play size={20} />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-slate-100">Output:</p>
        <div className="w-full bg-slate-900 text-blue-50 p-3 h-28 sm:h-36 overflow-y-auto rounded-lg border border-slate-700 text-sm sm:text-base">
          <pre>{output}</pre>
        </div>
      </div>
    </div>
  );
}

export default Editor;
