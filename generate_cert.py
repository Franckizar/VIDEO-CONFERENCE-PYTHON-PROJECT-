from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from datetime import datetime, timedelta

# Generate RSA private key
key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# Define the subject and issuer details
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, u"CM"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"Centre"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, u"Yaoundé"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"My Organization"),
    x509.NameAttribute(NameOID.COMMON_NAME, u"localhost"),
])

# Create the self-signed certificate
certificate = x509.CertificateBuilder().subject_name(
    subject
).issuer_name(
    issuer
).public_key(
    key.public_key()
).serial_number(
    x509.random_serial_number()
).not_valid_before(
    datetime.utcnow()
).not_valid_after(
    datetime.utcnow() + timedelta(days=365)
).sign(key, hashes.SHA256())

# Save the private key to a file
with open("key.pem", "wb") as key_file:
    key_file.write(key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ))

# Save the certificate to a file
with open("cert.pem", "wb") as cert_file:
    cert_file.write(certificate.public_bytes(serialization.Encoding.PEM))

print("Certificate and key have been generated: cert.pem, key.pem")
