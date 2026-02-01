export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

export const useScrollToTop = () => {
  const handleScrollToTop = () => {
    scrollToTop();
  };

  return { scrollToTop: handleScrollToTop };
};
