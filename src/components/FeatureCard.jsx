const FeatureCard = ({ title, description, image, buttonText }) => {
  return (
    <div className="flex flex-col gap-4 group cursor-pointer">
      <div className="overflow-hidden rounded-xl">
        <img 
          src={image} 
          alt={title} 
          className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <h3 className="text-2xl font-bold">{title}</h3>
      <p className="text-gray-600 line-clamp-2">{description}</p>
      <div>
        <button className="border-b border-transparent hover:border-black transition-all font-medium pb-1">
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default FeatureCard;
