export function useAnimations() {
  function pageEnter() {
    return {
      initial: { opacity: 0, y: 30 },
      enter: { opacity: 1, y: 0, transition: { duration: 500 } },
    }
  }

  function staggeredCard(index: number) {
    return {
      initial: { opacity: 0, y: 20 },
      enter: {
        opacity: 1,
        y: 0,
        transition: { duration: 400, delay: index * 80 },
      },
    }
  }

  function modalAnimation() {
    return {
      initial: { opacity: 0, scale: 0.9 },
      enter: { opacity: 1, scale: 1, transition: { duration: 300 } },
      leave: { opacity: 0, scale: 0.95, transition: { duration: 200 } },
    }
  }

  function slideFromRight() {
    return {
      initial: { opacity: 0, x: 100 },
      enter: { opacity: 1, x: 0, transition: { duration: 300 } },
    }
  }

  function slideHorizontal(direction: 'left' | 'right') {
    const x = direction === 'left' ? -50 : 50
    return {
      initial: { opacity: 0, x },
      enter: { opacity: 1, x: 0, transition: { duration: 300 } },
    }
  }

  function successCheckmark() {
    return {
      initial: { opacity: 0, scale: 0 },
      enter: {
        opacity: 1,
        scale: 1,
        transition: { duration: 500, type: 'spring', stiffness: 200, damping: 10 },
      },
    }
  }

  return {
    pageEnter,
    staggeredCard,
    modalAnimation,
    slideFromRight,
    slideHorizontal,
    successCheckmark,
  }
}
