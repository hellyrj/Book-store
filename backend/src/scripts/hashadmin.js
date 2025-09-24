import bcrypt from "bcrypt";

const password = "adminpassword123"; // change this to your admin password

const hashPassword = async () => {
  const hashed = await bcrypt.hash(password, 10);
  console.log("Hashed password:", hashed);
};

hashPassword();
