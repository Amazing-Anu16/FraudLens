import json
from engine import analyze

def test():
    print("--- Testing Benign Message ---")
    benign_msg = "Your Netflix OTP is 492019. Valid for 10 minutes. Do not share this with anyone."
    res1 = analyze(benign_msg)
    print(json.dumps(res1, indent=2))
    
    print("\n--- Testing Scam Message ---")
    scam_msg = "URGENT: Your SBI Bank account is blocked due to KYC update. Click http://bit.ly/sbi-kyc-update to update PAN now or account will be suspended."
    res2 = analyze(scam_msg)
    print(json.dumps(res2, indent=2))

if __name__ == "__main__":
    test()
