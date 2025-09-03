fetch("http://localhost:3000/api/test")
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error("Error:", err));
