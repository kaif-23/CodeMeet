import axios from "axios";
import { LANGUAGE_VERSIONS } from "../constants/constant";

const API = axios.create({
  baseURL: "/api",
});

export const executeCode = async ({ language, sourceCode }) => {
  console.log(language, sourceCode);
  const version = LANGUAGE_VERSIONS[language];
  if (!version) {
    throw new Error(`Language ${language} is not supported.`);
  }

  const response = await API.post("/execute", {
    language,
    version,
    files: [
      {
        content: sourceCode,
      },
    ],
  });
  return response.data;
};
