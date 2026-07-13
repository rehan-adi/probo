package types

// OrderHeap implements heap.Interface and holds pointers to Orders.
type OrderHeap []*Order

func (h OrderHeap) Len() int      { return len(h) }
func (h OrderHeap) Swap(i, j int) { h[i], h[j] = h[j], h[i] }

func (h *OrderHeap) Push(x interface{}) {
	*h = append(*h, x.(*Order))
}

func (h *OrderHeap) Pop() interface{} {
	old := *h
	n := len(old)
	item := old[n-1]
	old[n-1] = nil // avoid memory leak
	*h = old[0 : n-1]
	return item
}

// MaxHeap for Bids (Buy Orders): Highest price first.
// If prices are equal, earlier timestamp comes first (FIFO).
type BidHeap struct {
	OrderHeap
}

func (h BidHeap) Less(i, j int) bool {
	if h.OrderHeap[i].Price == h.OrderHeap[j].Price {
		return h.OrderHeap[i].Timestamp.Before(h.OrderHeap[j].Timestamp)
	}
	return h.OrderHeap[i].Price > h.OrderHeap[j].Price
}

// MinHeap for Asks (Sell Orders): Lowest price first.
// If prices are equal, earlier timestamp comes first (FIFO).
type AskHeap struct {
	OrderHeap
}

func (h AskHeap) Less(i, j int) bool {
	if h.OrderHeap[i].Price == h.OrderHeap[j].Price {
		return h.OrderHeap[i].Timestamp.Before(h.OrderHeap[j].Timestamp)
	}
	return h.OrderHeap[i].Price < h.OrderHeap[j].Price
}
