import React from 'react';
import { formatCOP } from '../../utils/helpers';

const deriveOriginalPrice = (discountedPrice, discountPercent) => {
  const price = Number(discountedPrice) || 0;
  const discount = Number(discountPercent) || 0;
  if (price <= 0 || discount <= 0 || discount >= 100) return price;
  const original = price / (1 - discount / 100);
  return Math.round(original);
};

const sizeClasses = {
  sm: {
    original: 'text-xs',
    discounted: 'text-sm',
    container: 'space-y-0.5',
    chip: 'text-[10px] px-2 py-0.5',
  },
  md: {
    original: 'text-sm',
    discounted: 'text-lg',
    container: 'space-y-1',
    chip: 'text-[11px] px-2.5 py-1',
  },
  lg: {
    original: 'text-base',
    discounted: 'text-2xl',
    container: 'space-y-1.5',
    chip: 'text-xs px-3 py-1.5',
  },
};

export default function PriceWithDiscount({
  price,
  discount,
  size = 'md',
  align = 'center',
  showBadge = true,
}) {
  const hasDiscount = Number(discount) > 0;
  const original = hasDiscount ? deriveOriginalPrice(price, discount) : price;
  const classes = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`flex flex-col ${classes.container} ${align === 'right' ? 'items-end' : align === 'left' ? 'items-start' : 'items-center'}`}
    >
      {hasDiscount ? (
        <>
          <div className={`text-gray-400 line-through ${classes.original}`}>
            {formatCOP(original)}
          </div>
          <div className={`font-extrabold text-gray-900 ${classes.discounted}`}>
            {formatCOP(price)}
          </div>
          {showBadge && (
            <div
              className={`inline-flex items-center rounded-full bg-[#a10009] text-white border border-[#CFA386] shadow-sm ${classes.chip} font-bold tracking-wide`}
            >
              {discount}% OFF
            </div>
          )}
        </>
      ) : (
        <div className={`font-extrabold text-gray-900 ${classes.discounted}`}>
          {formatCOP(price)}
        </div>
      )}
    </div>
  );
}
