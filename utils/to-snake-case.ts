export const toSnakeCase = (str: string) => {
  if (typeof str === "number") {
    str = `${str}`;
  }
  str = str ? str.replace(" ", "Empty Char") : str;
  try {
    return (
      str &&
      str
        .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
        .map((x) => x.toLowerCase())
        .join("_")
    );
  } catch (err) {
    console.log(str);
    console.log(str.split(""));
    console.log(str.match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g));
    console.log(err.message);
    return str;
  }
};
