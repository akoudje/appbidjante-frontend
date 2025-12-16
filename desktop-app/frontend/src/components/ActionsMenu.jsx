import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import { HiOutlineEllipsisVertical } from "react-icons/hi2";

export default function ActionsMenu({ items = [] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="p-2 rounded hover:bg-gray-100 transition focus:outline-none">
        <HiOutlineEllipsisVertical size={22} />
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-150"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-100"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-44 origin-top-right bg-white border border-gray-200 shadow-lg rounded-lg py-2 z-50">
          {items.map((item, index) => (
            <Menu.Item key={index}>
              {({ active }) => (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm ${
                    active ? "bg-gray-100" : ""
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
