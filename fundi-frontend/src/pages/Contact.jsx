import React from 'react';

const Contact = () => (
  <div className="max-w-xl mx-auto py-12 px-4">
    <h1 className="text-3xl font-bold mb-4 text-center">Contact Me</h1>
    <form className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">Name</label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Your Name" />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
        <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="email" type="email" placeholder="Your Email" />
      </div>
      <div className="mb-6">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">Message</label>
        <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="message" placeholder="Your Message" rows="4"></textarea>
      </div>
      <div className="flex items-center justify-between">
        <button className="bg-black hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline" type="button">
          Send
        </button>
      </div>
    </form>
    <div className="text-center text-gray-600">
      <p>Email: support@fundi-link.com</p>
      <p>Phone: +123 456 7890</p>
    </div>
  </div>
);

export default Contact; 