export type MilestoneId =
  | "autograd"
  | "neuron"
  | "mlp"
  | "backprop"
  | "training"
  | "evaluation";

export interface Milestone {
  id: MilestoneId;
  title: string;
  description: string;
  objectives: string[];
  verificationPrompt: string;
  references: string[];
  prerequisites: MilestoneId[];
}

export const MILESTONES: Milestone[] = [
  {
    id: "autograd",
    title: "Scalar Autograd Engine",
    description:
      "Build a minimal automatic differentiation engine from scratch. You will implement a `Value` class that wraps a single scalar number, records the operation that produced it, and can propagate gradients backward through the computation graph. This is the core of every modern deep-learning framework — a bare-metal version of PyTorch's autograd.",
    objectives: [
      "Implement `class Value` with a `.data` field holding a float and a `.grad` field initialized to 0.",
      "Override `__add__`, `__mul__`, and `tanh` so each operation creates a new `Value` and stores a `_backward` closure that applies the chain rule.",
      "Implement `backward()` that builds a topological ordering of the computation graph and calls `_backward` on each node in reverse order, accumulating `.grad`.",
      "Verify: define `a = Value(2); b = Value(3); c = a * b + a.tanh(); c.backward()` and check that `a.grad` and `b.grad` are correct by comparison with manual calculus.",
    ],
    verificationPrompt:
      "The learner has implemented a scalar autograd engine. Ask them to share their `Value` class code. Verify that: (1) `_backward` closures apply the correct local derivative for add and multiply; (2) `backward()` traverses the graph in reverse topological order; (3) the `tanh` derivative is `1 - tanh(x)^2`; (4) running the engine on `a*b + tanh(a)` with `a=2, b=3` produces the analytically correct gradients. If the implementation is correct, confirm success and award the milestone. If there are bugs, point to the specific incorrect derivative and ask the learner to fix it.",
    references: [
      "Andrej Karpathy — 'The spelled-out intro to neural networks and backpropagation: building micrograd' (YouTube, 2022)",
      "Karpathy micrograd repository: github.com/karpathy/micrograd",
      "Michael Nielsen — 'Neural Networks and Deep Learning', Chapter 2: 'How the backpropagation algorithm works'",
    ],
    prerequisites: [],
  },
  {
    id: "neuron",
    title: "Neuron & Linear Layer",
    description:
      "Use your autograd `Value` class to build the fundamental computational unit of a neural network: a single neuron. A neuron computes a weighted sum of its inputs plus a bias, then applies a non-linear activation. From neurons you will build a linear `Layer` that combines many neurons acting in parallel.",
    objectives: [
      "Implement `class Neuron(nin)` that initializes `nin` random `Value` weights and one `Value` bias.",
      "Implement `__call__(x)` on `Neuron` that computes `tanh(sum(wi * xi) + b)` using `Value` arithmetic.",
      "Implement `parameters()` on `Neuron` returning `[*self.w, self.b]`.",
      "Implement `class Layer(nin, nout)` as a list of `nout` `Neuron` instances whose `__call__` maps an input vector to a list of `nout` outputs.",
      "Verify that calling `neuron([Value(1.0), Value(0.5)])` returns a scalar `Value` and that calling `backward()` on the result sets non-zero gradients on all weights and the bias.",
    ],
    verificationPrompt:
      "The learner has implemented a `Neuron` and a `Layer` class. Ask them to share the code. Verify: (1) weights are initialized with random values, not zeros; (2) `__call__` constructs the dot product and bias addition using `Value` arithmetic so the computation graph is intact; (3) `parameters()` returns all `Value` leaves; (4) gradients flow back through the neuron correctly. If correct, award the milestone. If the dot product bypasses `Value` arithmetic (e.g. using raw floats), ask the learner to fix it so gradients work.",
    references: [
      "Michael Nielsen — 'Neural Networks and Deep Learning', Chapter 1: 'Using neural nets to recognize handwritten digits'",
      "Karpathy micrograd: micrograd/engine.py and micrograd/nn.py",
    ],
    prerequisites: ["autograd"],
  },
  {
    id: "mlp",
    title: "Multi-Layer Perceptron",
    description:
      "Stack multiple `Layer` objects to build a Multi-Layer Perceptron (MLP) — the architecture behind most early breakthroughs in neural networks. You will compose layers into a full network, run a forward pass, and collect all trainable parameters so you can later adjust them during training.",
    objectives: [
      "Implement `class MLP(nin, nouts)` where `nouts` is a list of layer sizes, constructing one `Layer` per consecutive pair.",
      "Implement `__call__(x)` that passes the input through each layer in sequence, returning the final output.",
      "Implement `parameters()` that returns the flat list of all `Value` leaves across all layers.",
      "Run a forward pass: create `model = MLP(2, [4, 4, 1])` and call it on `[Value(0.5), Value(-0.3)]`. Confirm the output is a single `Value`.",
      "Verify the parameter count matches `2*4 + 4 + 4*4 + 4 + 4*1 + 1 = 37` for that architecture.",
    ],
    verificationPrompt:
      "The learner has implemented an MLP. Ask them to share the code and the output of `len(model.parameters())` for `MLP(2, [4, 4, 1])`. Verify: (1) the parameter count is 37 (or they can explain a different count if their architecture differs); (2) calling `model([Value(x), Value(y)])` returns a `Value` and calling `backward()` on the result sets gradients on every parameter; (3) the layers are composed in order. If correct, award the milestone.",
    references: [
      "Michael Nielsen — 'Neural Networks and Deep Learning', Chapter 2: 'How the backpropagation algorithm works'",
      "Karpathy micrograd: micrograd/nn.py — `MLP` class",
    ],
    prerequisites: ["neuron"],
  },
  {
    id: "backprop",
    title: "Backpropagation",
    description:
      "Deepen your understanding of why backpropagation works by deriving the chain rule manually for each primitive operation in your autograd engine, then verifying your engine's gradients against a numerical approximation. This is the most important theoretical milestone: if you can derive and verify the gradients yourself, you truly understand what your network is doing.",
    objectives: [
      "Write out by hand (or in a document/notebook) the derivative of `z = a + b` w.r.t. `a` and `b`; the derivative of `z = a * b` w.r.t. `a` and `b`; and the derivative of `z = tanh(a)` w.r.t. `a`.",
      "Implement numerical gradient checking: for each parameter `p`, compute `(f(p + h) - f(p - h)) / (2*h)` with `h = 1e-5` and compare to `p.grad` after `backward()`.",
      "Run gradient checking on the output of `MLP(2, [4, 1])` applied to a small input and confirm that analytical and numerical gradients agree to within `1e-4`.",
      "Trace the backward pass on a tiny 2-node graph (`c = a * b; c.backward()`) step by step, labelling the gradient flowing into each node.",
    ],
    verificationPrompt:
      "The learner has derived the backprop equations and verified their implementation numerically. Ask them to: (1) state the derivative of tanh(x); (2) share their gradient-check code and its output; (3) explain what the chain rule says about why gradients multiply when you compose operations. If numerical and analytical gradients agree within 1e-4 and the learner can explain the chain rule, award the milestone. If not, ask them to show the gradient-check loop and debug together.",
    references: [
      "Michael Nielsen — 'Neural Networks and Deep Learning', Chapter 2: equations BP1–BP4",
      "Karpathy micrograd lecture — section on 'manual backprop' (approx. 1h mark)",
      "CS231n notes — 'Backpropagation, Intuitions': cs231n.github.io/optimization-2/",
    ],
    prerequisites: ["mlp"],
  },
  {
    id: "training",
    title: "Training Loop",
    description:
      "Bring your network to life by training it on a real dataset. You will implement a full training loop: forward pass to compute a loss, backward pass to compute gradients, and a gradient descent update step. Train your MLP on the XOR problem (4 examples) or a moons dataset and watch the loss decrease.",
    objectives: [
      "Define the XOR dataset: inputs `[[0,0],[0,1],[1,0],[1,1]]` and labels `[0,1,1,0]` (or use ±1 and tanh output).",
      "Compute a mean-squared-error (MSE) loss: `loss = sum((y_pred - y_true)**2) / n` using `Value` arithmetic.",
      "Implement a training step: call `backward()` on the loss, then update each parameter `p.data -= lr * p.grad`, then zero all gradients (`p.grad = 0`).",
      "Run 100+ iterations and confirm the loss decreases monotonically (or near-monotonically) with `lr = 0.05`.",
      "Print the loss every 10 steps and share the output showing convergence.",
    ],
    verificationPrompt:
      "The learner has trained an MLP on XOR or a similar small dataset. Ask them to share the training loop code and the loss log. Verify: (1) gradients are zeroed before each backward pass; (2) the update rule subtracts `lr * grad` (gradient *descent*); (3) the loss decreases over 100 iterations; (4) the trained model classifies XOR inputs correctly (output > 0.5 for true, < 0.5 for false, or equivalent with ±1 labels). If the loss does not decrease, ask the learner to check their zero-grad step and learning rate. Award the milestone when the model trains successfully.",
    references: [
      "Michael Nielsen — 'Neural Networks and Deep Learning', Chapter 1: 'How the backpropagation algorithm works'",
      "Karpathy micrograd demo notebook (github.com/karpathy/micrograd/blob/master/demo.ipynb)",
    ],
    prerequisites: ["backprop"],
  },
  {
    id: "evaluation",
    title: "Evaluation & Generalization",
    description:
      "A trained network is only as good as its performance on unseen data. In this final milestone you will evaluate your trained MLP, visualize the loss curve over training, measure accuracy on held-out examples, and reflect on the concepts of overfitting and regularization — the practical concerns that motivate modern deep-learning techniques.",
    objectives: [
      "Record the loss at every training iteration and plot a loss curve (use the gradient-descent visualization from the STEM viz engine, or a simple line chart).",
      "Split your dataset (or generate a larger synthetic one) into train and test sets. Measure accuracy on the test set after training.",
      "Identify whether the model overfits (test loss much higher than train loss) or generalizes well.",
      "Describe in your own words what L2 regularization does and how you would add it to your MSE loss: `loss = mse + lambda * sum(p.data**2 for p in model.parameters())`.",
      "Optionally: implement L2 regularization and retrain, comparing loss curves with and without it.",
    ],
    verificationPrompt:
      "The learner has evaluated their trained MLP and reflected on generalization. Ask them to: (1) share the loss curve (image or printed values); (2) state the test accuracy; (3) explain in one sentence what overfitting means; (4) write the L2-regularized loss expression. If all four points are addressed correctly, award the capstone mastery signal — this completes the neural-net capstone. Congratulate the learner and suggest exploring PyTorch/JAX as the industrial version of what they built.",
    references: [
      "Michael Nielsen — 'Neural Networks and Deep Learning', Chapter 3: 'Improving the way neural networks learn' (overfitting, regularization)",
      "Karpathy micrograd demo — final training visualization",
      "Nielsen ch. 3, section 'Overfitting and regularization'",
    ],
    prerequisites: ["training"],
  },
];

export const MATH_PREREQUISITES: Record<string, number> = {
  derivatives: 60,
  linear_algebra_basics: 60,
};
