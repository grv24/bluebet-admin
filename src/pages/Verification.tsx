import React from 'react'

const Verification = () => {
  return (
    <div className="p-2 sm:p-4 bg-[#fafafa] min-h-screen">
      <h2 className="m-0 text-lg font-normal mb-2">Secure Auth Verification</h2>
      <div className="flex flex-col items-center justify-center w-full mt-8 mb-4">
        <div className="text-center">
          <div className="mb-2 text-base font-medium">
            Secure Auth Verification Status:
            <span className="ml-2 px-2 py-0.5 rounded-full bg-[#e74c3c] text-white text-xs align-middle">Disabled</span>
          </div>
          <div className="mb-4 text-base font-normal">
            Please select below option to enable secure auth verification
          </div>
          <div className="flex flex-row gap-8 justify-center items-center mb-4">
            <button className="text-base font-medium text-[#444] hover:underline focus:underline transition cursor-pointer bg-transparent border-none p-0">
              Enable Using Mobile App
            </button>
            <button className="text-base font-medium text-[#444] hover:underline focus:underline transition cursor-pointer bg-transparent border-none p-0">
              Enable Using Telegram
            </button>
          </div>
        </div>
        <hr className="w-full border-t border-gray-300 mt-2" />
      </div>
    </div>
  )
}

export default Verification