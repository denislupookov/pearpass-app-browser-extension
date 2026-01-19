import React from 'react'

import { SearchIcon } from '../../icons/SearchIcon'

/**
 *
 * @param {{
 *  value: string
 *  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
 *  quantity?: number
 *  placeholder: string
 * }} props
 */
export const InputSearch = ({ value, onChange, quantity, placeholder }) => (
  <div className="bg-black-mode1 text-white-mode1 font-inter flex w-full items-center gap-[10px] rounded-[15px] px-[10px] py-[6px] text-base">
    <label className="flex flex-grow-0">
      <SearchIcon />
    </label>
    <input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="text-grey200-mode1 flex-1 bg-transparent font-medium outline-none"
    />
    <div className="text-white-mode1 flex-grow-0 font-extralight">
      {value?.length ? quantity : null}
    </div>
  </div>
)
