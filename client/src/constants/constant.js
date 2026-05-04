export const LANGUAGE_IDS = {
  javascript: "nodejs",
  python: "python3",
  cpp: "cpp17",
  java: "java",
};

// JDoodle uses versionIndex strings per language (update if needed).
export const LANGUAGE_VERSIONS = {
  javascript: "0",
  python: "0",
  cpp: "0",
  java: "0",
};

export const LANGUAGE_MODES = {
  javascript: "javascript",
  python: "python",
  cpp: "text/x-c++src",
  java: "text/x-java",
};

export const CODE_SNIPPETS = {
  javascript: `\nfunction greet(name) {\n\tconsole.log("Hello, " + name + "!");\n}\n\ngreet("Alex");\n`,

  python: `\ndef greet(name):\n\tprint("Hello, " + name + "!")\n\ngreet("Alex")\n`,
  cpp: `\n#include <iostream>\n\nint main() {\n\tstd::cout << "Hello World" << std::endl;\n\treturn 0;\n}\n`,
  java: `\npublic class HelloWorld {\n\tpublic static void main(String[] args) {\n\t\tSystem.out.println("Hello World");\n\t}\n}\n`,
};