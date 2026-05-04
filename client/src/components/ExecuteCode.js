import axios from "axios";
import { LANGUAGE_IDS, LANGUAGE_VERSIONS } from "../constants/constant";

const API = axios.create({
  baseURL: "/api",
});

export const executeCode = async ({ language, sourceCode }) => {
  console.log(language, sourceCode);
  const languageId = LANGUAGE_IDS[language];
  const versionIndex = LANGUAGE_VERSIONS[language];
  if (!languageId || versionIndex === undefined) {
    throw new Error(`Language ${language} is not supported.`);
  }

  const response = await API.post("/execute", {
    language: languageId,
    versionIndex,
    sourceCode,
  });
  const result = response.data || {};
  const output =
    typeof result.output === "string"
      ? result.output
      : result.stderr || result.error || "";
  return {
    run: {
      output,
    },
    raw: result,
  };
};
