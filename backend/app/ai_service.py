import os
import re
import httpx
import importlib
import logging
import hashlib

logger = logging.getLogger(__name__)

AsyncOpenAI = None
try:
    openai_module = importlib.import_module("openai")
    AsyncOpenAI = getattr(openai_module, "AsyncOpenAI", None)
except Exception as e:
    logger.warning(f"OpenAI module not available: {e}")
    AsyncOpenAI = None

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()
AI_PROVIDER = os.getenv("AI_PROVIDER", "auto").strip().lower()
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.1:8b")

# Initialize OpenAI client
client = None
if OPENAI_API_KEY and AsyncOpenAI:
    try:
        client = AsyncOpenAI(api_key=OPENAI_API_KEY)
        logger.info("✓ OpenAI client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize OpenAI client: {e}")
        client = None
else:
    if not OPENAI_API_KEY:
        logger.warning("⚠ OPENAI_API_KEY not set in environment")
    if not AsyncOpenAI:
        logger.warning("⚠ AsyncOpenAI not available - openai module may not be installed")


def _resolve_provider() -> str:
    if AI_PROVIDER in {"openai", "ollama", "mock"}:
        logger.debug(f"Using explicitly configured provider: {AI_PROVIDER}")
        return AI_PROVIDER
    
    if OPENAI_API_KEY and client:
        logger.debug("Using OpenAI as default provider (API key available)")
        return "openai"
    
    logger.debug("Using mock provider as fallback")
    return "mock"


async def _ollama_chat(prompt: str, system: str) -> str:
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
    }
    async with httpx.AsyncClient(timeout=60) as ac:
        resp = await ac.post(f"{OLLAMA_URL}/api/chat", json=payload)
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "")


class MermaidDiagramGenerator:
    """Pure algorithmic Mermaid diagram generator - no hardcoded templates."""

    # Diagram type patterns
    DIAGRAM_PATTERNS = {
        'flowchart': ['flow', 'process', 'step', 'workflow', 'roadmap', 'path', 'learning', 'guide', 'progress', 'stages', 'phases'],
        'sequence': ['sequence', 'order', 'timeline', 'flow', 'interaction', 'request', 'response', 'call', 'api'],
        'class': ['class', 'model', 'structure', 'object', 'inherit', 'uml', 'schema', 'database'],
        'state': ['state', 'status', 'mode', 'condition', 'finite', 'machine', 'stage'],
        'entity': ['er', 'entity', 'relationship', 'database', 'schema', 'table', 'model'],
        'mindmap': ['mind', 'brainstorm', 'concept', 'idea', 'topic', 'central', 'root'],
        'architecture': ['system', 'architecture', 'service', 'microservice', 'backend', 'frontend', 'infrastructure', 'deploy'],
        'network': ['network', 'server', 'client', 'cloud', 'aws', 'azure', 'infrastructure', '拓扑'],
    }

    # Category keywords for intelligent grouping
    CATEGORY_KEYWORDS = {
        'foundation': ['basic', 'fundament', 'intro', 'begin', 'start', 'core', 'essential', 'base'],
        'intermediate': ['medium', 'mid', 'moderate', 'advance'],
        'advanced': ['expert', 'pro', 'master', 'senior', 'specialize'],
        'frontend': ['ui', 'web', 'browser', 'react', 'vue', 'angular', 'html', 'css', 'javascript'],
        'backend': ['server', 'api', 'database', 'logic', 'business', 'java', 'python', 'node', 'rust'],
        'devops': ['deploy', 'ci/cd', 'docker', 'kubernetes', 'cloud', 'aws', 'devops', 'infrastructure'],
        'data': ['data', 'analytics', 'ml', 'ai', 'machine', 'learning', 'big', 'warehouse'],
        'security': ['security', 'auth', 'oauth', 'jwt', 'encryption', 'ssl', 'tls', 'permission'],
    }

    def __init__(self, prompt: str):
        self.prompt = prompt.lower()
        self.words = prompt.split()
        self.diagram_type = self._detect_diagram_type()
        self.categories = self._detect_categories()
        self.entities = self._extract_entities()

    def _detect_diagram_type(self) -> str:
        """Detect the best diagram type based on prompt analysis."""
        scores = {dtype: 0 for dtype in self.DIAGRAM_PATTERNS}

        for dtype, patterns in self.DIAGRAM_PATTERNS.items():
            for pattern in patterns:
                if pattern in self.prompt:
                    scores[dtype] += 2
                    # Check for compound matches
                    if any(p in self.prompt for p in [f'{pattern}chart', f'{pattern}diagram']):
                        scores[dtype] += 1

        # Special cases
        if 'flowchart' in self.prompt or 'flow chart' in self.prompt:
            scores['flowchart'] += 3
        if 'mindmap' in self.prompt or 'mind map' in self.prompt:
            scores['mindmap'] += 3

        # Return highest scoring type
        best_type = max(scores, key=scores.get)
        return best_type if scores[best_type] > 0 else 'flowchart'

    def _detect_categories(self) -> list:
        """Detect categories/topics in the prompt."""
        categories = []
        for cat, keywords in self.CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in self.prompt:
                    categories.append(cat)
                    break
        return categories

    def _extract_entities(self) -> list:
        """Extract meaningful entities from the prompt."""
        # Common technical terms to look for
        common_terms = [
            'api', 'database', 'server', 'client', 'user', 'auth', 'login', 'register',
            'admin', 'dashboard', 'payment', 'order', 'product', 'service', 'cache',
            'queue', 'worker', 'gateway', 'router', 'controller', 'model', 'view',
            'frontend', 'backend', 'mobile', 'web', 'desktop', 'cloud', 'deploy',
            'test', 'build', 'release', 'monitor', 'log', 'metric', 'alert',
            'security', 'encryption', 'token', 'session', 'cookie',
            'microservice', 'monolith', 'architecture', 'system', 'component',
            'module', 'package', 'library', 'framework', 'sdk', 'cli',
            'git', 'github', 'gitlab', 'ci', 'cd', 'pipeline', 'docker', 'kubernetes',
            'aws', 'azure', 'gcp', 'firebase', 'vercel', 'netlify',
            'react', 'vue', 'angular', 'next', 'svelte', 'node', 'python', 'java',
            'rust', 'go', 'typescript', 'javascript', 'sql', 'nosql', 'mongodb', 'postgres',
            'redis', 'elasticsearch', 'kafka', 'rabbitmq', 'websocket', 'grpc', 'rest',
            'graphql', 'oauth', 'jwt', 'saml', 'ldap', 'kerberos',
        ]

        # Extract words that might be entities (3+ chars, not common stopwords)
        stopwords = {'the', 'and', 'for', 'with', 'from', 'that', 'this', 'are', 'have', 'has', 'was', 'were', 'been', 'being', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'need', 'want', 'like', 'just', 'about', 'into', 'over', 'under', 'after', 'before', 'between', 'through', 'during', 'above', 'below', 'then', 'than', 'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same', 'so', 'too', 'very', 'also'}

        entities = []
        for word in self.words:
            clean_word = word.strip(',.!?;:"\'()[]{}').lower()
            if len(clean_word) >= 2:
                # Check if it's a known term
                if clean_word in common_terms:
                    entities.append(clean_word)
                # Or capitalize and add if it looks like a proper noun
                elif clean_word[0].isupper() or (clean_word.isalpha() and len(clean_word) > 3 and clean_word not in stopwords):
                    entities.append(clean_word)

        # Add any multi-word phrases from the prompt
        phrases = ['data structure', 'machine learning', 'system design', 'software architecture',
                   'ci cd pipeline', 'rest api', 'graphql api', 'user interface', 'user experience',
                   'single page application', 'progressive web app', 'domain driven design',
                   'test driven development', 'clean code', 'design pattern']
        for phrase in phrases:
            if phrase in self.prompt:
                entities.append(phrase.replace(' ', '_'))

        # Remove duplicates while preserving order
        seen = set()
        unique_entities = []
        for e in entities:
            if e not in seen:
                seen.add(e)
                unique_entities.append(e)

        return unique_entities[:12]  # Limit to 12 entities max

    def _create_flowchart(self) -> str:
        """Create a flowchart diagram with intelligent layout."""
        lines = ["flowchart LR"]

        if not self.entities:
            self.entities = ['Start', 'Process', 'End']

        # Group entities into clusters based on categories
        clusters = self._group_into_clusters()

        if clusters:
            # Use subgraphs for clusters
            for i, cluster in enumerate(clusters):
                subgraph_name = f"Cluster_{i}"
                lines.append(f"    subgraph {subgraph_name}")
                for entity in cluster:
                    safe_id = self._safe_id(entity)
                    lines.append(f"        {safe_id}[\"{self._format_label(entity)}\"]")
                lines.append("    end")

            # Connect clusters sequentially
            for i in range(len(clusters) - 1):
                lines.append(f"    Cluster_{i} --> Cluster_{i+1}")
        else:
            # Simple linear flow
            for i, entity in enumerate(self.entities):
                safe_id = self._safe_id(entity)
                lines.append(f"    {safe_id}[\"{self._format_label(entity)}\"]")

            # Connect sequentially
            for i in range(len(self.entities) - 1):
                lines.append(f"    {self._safe_id(self.entities[i])} --> {self._safe_id(self.entities[i+1])}")

        return '\n'.join(lines)

    def _create_architecture_diagram(self) -> str:
        """Create a system architecture diagram."""
        lines = ["flowchart TD"]

        if not self.entities:
            self.entities = ['Client', 'Server', 'Database']

        # Identify client and server components
        client_entities = [e for e in self.entities if e in ['client', 'frontend', 'web', 'mobile', 'browser', 'ui']]
        server_entities = [e for e in self.entities if e in ['server', 'backend', 'api', 'service', 'gateway']]
        data_entities = [e for e in self.entities if e in ['database', 'db', 'cache', 'storage', 'redis', 'mongodb', 'postgres', 'sql']]

        # If no specific categorization, infer from prompt
        if not client_entities and not server_entities:
            client_entities = self.entities[:1] if self.entities else ['Client']
            server_entities = self.entities[1:3] if len(self.entities) > 1 else ['API']
            data_entities = self.entities[3:4] if len(self.entities) > 3 else ['Database']

        # Add clients
        if client_entities:
            lines.append("    subgraph Client_Layer")
            for e in client_entities:
                lines.append(f"        C{client_entities.index(e)}[\"{self._format_label(e)}\"]")
            lines.append("    end")

        # Add servers
        if server_entities:
            lines.append("    subgraph Server_Layer")
            for e in server_entities:
                idx = server_entities.index(e)
                lines.append(f"        S{idx}[\"{self._format_label(e)}\"]")
            lines.append("    end")

        # Add data layer
        if data_entities:
            lines.append("    subgraph Data_Layer")
            for e in data_entities:
                idx = data_entities.index(e)
                lines.append(f"        D{idx}[(\"{self._format_label(e)}\")]")
            lines.append("    end")

        # Connect layers
        if client_entities and server_entities:
            lines.append(f"    C0 --> S0")
        if server_entities and data_entities:
            lines.append(f"    S0 --> D0")
        if client_entities and data_entities and not server_entities:
            lines.append(f"    C0 --> D0")

        return '\n'.join(lines)

    def _create_sequence(self) -> str:
        """Create a sequence diagram."""
        lines = ["sequenceDiagram"]

        if not self.entities:
            self.entities = ['Client', 'Server', 'Database']

        # Create participants
        for entity in self.entities:
            safe_id = self._safe_id(entity)
            lines.append(f"    participant {safe_id} as {self._format_label(entity)}")

        # Create sequence flow
        for i in range(len(self.entities) - 1):
            curr = self._safe_id(self.entities[i])
            next_ent = self._safe_id(self.entities[i + 1])
            lines.append(f"    {curr}->>+{next_ent}: Request")
            lines.append(f"    {next_ent}-->>-{curr}: Response")

        return '\n'.join(lines)

    def _create_class_diagram(self) -> str:
        """Create a class diagram."""
        lines = ["classDiagram"]

        if not self.entities:
            self.entities = ['User', 'Service', 'Repository']

        # Create classes
        for entity in self.entities:
            safe_id = self._safe_id(entity)
            lines.append(f"    class {safe_id} {{")
            lines.append(f"        +id: string")
            lines.append(f"        +name: string")
            lines.append(f"        +created_at: datetime")
            lines.append(f"        +create()")
            lines.append(f"        +read()")
            lines.append(f"        +update()")
            lines.append(f"        +delete()")
            lines.append("    }")

        # Create relationships
        for i in range(len(self.entities) - 1):
            lines.append(f"    {self._safe_id(self.entities[i])} --|> {self._safe_id(self.entities[i+1])}")

        return '\n'.join(lines)

    def _create_state_diagram(self) -> str:
        """Create a state diagram."""
        lines = ["stateDiagram-v2"]

        if not self.entities:
            self.entities = ['Active', 'Processing', 'Complete']

        lines.append("    [*] --> " + self._safe_id(self.entities[0]))

        for i in range(len(self.entities) - 1):
            lines.append(f"    {self._safe_id(self.entities[i])} --> {self._safe_id(self.entities[i+1])}")

        lines.append(f"    {self._safe_id(self.entities[-1])} --> [*]")

        return '\n'.join(lines)

    def _create_mindmap(self) -> str:
        """Create a mindmap diagram."""
        lines = ["mindmap"]

        # Root is the first meaningful word from prompt
        root = "Root"
        for word in self.prompt.split():
            if len(word) > 3 and word not in ['this', 'that', 'with', 'from']:
                root = word.capitalize()
                break

        lines.append(f"    root(({root}))")

        if not self.entities:
            self.entities = ['Concept 1', 'Concept 2', 'Concept 3']

        # Create branches
        for entity in self.entities:
            lines.append(f"        {self._format_label(entity)}")

        return '\n'.join(lines)

    def _create_entity_relationship(self) -> str:
        """Create an ER diagram."""
        lines = ["erDiagram"]

        if not self.entities:
            self.entities = ['User', 'Order', 'Product']

        # Create entities with attributes
        for entity in self.entities:
            safe_id = self._safe_id(entity)
            lines.append(f"    {safe_id} {{")
            lines.append(f"        int id PK")
            lines.append(f"        string name")
            lines.append(f"        datetime created_at")
            lines.append("    }")

        # Create relationships
        for i in range(len(self.entities) - 1):
            lines.append(f"    {self._safe_id(self.entities[i])} ||--o{{ {self._safe_id(self.entities[i+1])} : \"has\"")

        return '\n'.join(lines)

    def _create_network_diagram(self) -> str:
        """Create a network topology diagram."""
        lines = ["flowchart TB"]

        if not self.entities:
            self.entities = ['Internet', 'Load Balancer', 'App Server', 'Database']

        # Group into network zones
        external = [e for e in self.entities if e in ['internet', 'client', 'user', 'cdn', 'dns']]
        dmz = [e for e in self.entities if e in ['load', 'balancer', 'gateway', 'proxy', 'firewall']]
        app = [e for e in self.entities if e in ['server', 'app', 'application', 'service', 'api', 'container', 'pod']]
        data = [e for e in self.entities if e in ['database', 'db', 'storage', 'cache', 'redis']]

        # Build the diagram
        if external:
            lines.append("    subgraph External")
            for e in external:
                lines.append(f"        ext[(\"{self._format_label(e)}\")]")
            lines.append("    end")

        if dmz:
            lines.append("    subgraph DMZ")
            for e in dmz:
                lines.append(f"        dmz[\"{self._format_label(e)}\"]")
            lines.append("    end")

        if app:
            lines.append("    subgraph Application")
            for e in app:
                lines.append(f"        app[\"{self._format_label(e)}\"]")
            lines.append("    end")

        if data:
            lines.append("    subgraph Data")
            for e in data:
                lines.append(f"        db[(\"{self._format_label(e)}\")]")
            lines.append("    end")

        # Connect zones
        if external and dmz:
            lines.append("    ext --> dmz")
        elif external and app:
            lines.append("    ext --> app")
        if dmz and app:
            lines.append("    dmz --> app")
        if app and data:
            lines.append("    app --> db")

        return '\n'.join(lines)

    def _group_into_clusters(self) -> list:
        """Group entities into logical clusters."""
        if len(self.entities) <= 3:
            return []

        # Create clusters based on semantic similarity
        clusters = []
        current_cluster = []

        for entity in self.entities:
            # Simple clustering by length and common prefixes
            if not current_cluster:
                current_cluster.append(entity)
            elif len(current_cluster) < 4:  # Max 4 per cluster
                current_cluster.append(entity)
            else:
                clusters.append(current_cluster)
                current_cluster = [entity]

        if current_cluster:
            clusters.append(current_cluster)

        return clusters if len(clusters) > 1 else []

    def _safe_id(self, text: str) -> str:
        """Create a safe Mermaid node ID."""
        # Remove special characters and create valid ID
        safe = ''.join(c if c.isalnum() else '_' for c in text.lower())
        return safe[:20]  # Limit length

    def _format_label(self, text: str) -> str:
        """Format text as a nice label."""
        # Replace underscores with spaces and capitalize
        text = text.replace('_', ' ')
        if len(text) > 25:
            text = text[:22] + '...'
        return text

    def generate(self) -> str:
        """Generate the appropriate Mermaid diagram based on analysis."""
        diagram_generators = {
            'flowchart': self._create_flowchart,
            'architecture': self._create_architecture_diagram,
            'sequence': self._create_sequence,
            'class': self._create_class_diagram,
            'state': self._create_state_diagram,
            'mindmap': self._create_mindmap,
            'entity': self._create_entity_relationship,
            'network': self._create_network_diagram,
        }

        generator = diagram_generators.get(self.diagram_type, self._create_flowchart)
        return generator()


def _mock_diagram(prompt: str) -> str:
    """Generate a Mermaid diagram using pure algorithmic analysis."""
    generator = MermaidDiagramGenerator(prompt)
    return generator.generate()


def _humanize_response(prompt: str, extra: str = "") -> str:
    """Wrap AI output in a warm, conversational tone."""
    import random
    openers = [
        f"Hey! I've put together a visual for \"{ prompt[:60] }\" — here's what I came up with.",
        f"Great idea! I sketched out \"{ prompt[:60] }\" for you. Take a look and tweak as you like.",
        f"Here you go! I turned \"{ prompt[:60] }\" into a diagram. Feel free to move things around.",
        f"Nice prompt! I whipped up a visual of \"{ prompt[:60] }\". Hope it captures what you had in mind!",
        f"Alright, I gave \"{ prompt[:60] }\" my best shot — the diagram is on your canvas now.",
    ]
    tips = [
        "💡 Tip: You can drag and resize the image once it's on the canvas.",
        "💡 Tip: Try zooming in to check the finer details.",
        "💡 Tip: Pair this diagram with labels using the Text tool.",
        "💡 Tip: Use the document panel to annotate what each part means.",
    ]
    parts = [random.choice(openers)]
    if extra:
        parts.append(extra)
    parts.append(random.choice(tips))
    return "\n\n".join(parts)


def _build_mock_svg(prompt: str) -> str:
    """Generate a nice mock SVG diagram from the prompt."""
    import hashlib
    h = hashlib.md5(prompt.encode()).hexdigest()
    # Derive stable colours from the hash
    c1 = f"#{h[0:6]}"
    c2 = f"#{h[6:12]}"
    c3 = f"#{h[12:18]}"

    words = prompt.split()
    # Build up to 5 labelled boxes from prompt keywords
    boxes = []
    keywords = [w.strip(",.!?") for w in words if len(w) > 2][:5]
    if len(keywords) < 2:
        keywords = ["Service A", "Service B", "Database"]

    cols = min(len(keywords), 3)
    box_w, box_h, gap_x, gap_y = 150, 60, 40, 80
    start_x, start_y = 30, 30
    svg_items = []
    positions = []

    for i, kw in enumerate(keywords):
        row = i // cols
        col = i % cols
        x = start_x + col * (box_w + gap_x)
        y = start_y + row * (box_h + gap_y)
        positions.append((x, y, kw))
        rx = 12
        fills = [c1, c2, c3]
        fill = fills[i % len(fills)]
        svg_items.append(
            f'<rect x="{x}" y="{y}" width="{box_w}" height="{box_h}" rx="{rx}" '
            f'fill="{fill}" fill-opacity="0.15" stroke="{fill}" stroke-width="2"/>'
        )
        svg_items.append(
            f'<text x="{x + box_w // 2}" y="{y + box_h // 2 + 5}" '
            f'text-anchor="middle" font-family="Inter,system-ui,sans-serif" '
            f'font-size="13" font-weight="600" fill="{fill}">{kw.capitalize()}</text>'
        )

    # Draw arrows between consecutive boxes
    for i in range(len(positions) - 1):
        x1 = positions[i][0] + box_w
        y1 = positions[i][1] + box_h // 2
        x2 = positions[i + 1][0]
        y2 = positions[i + 1][1] + box_h // 2
        # If wrapping to next row, adjust
        if positions[i + 1][0] <= positions[i][0]:
            x1 = positions[i][0] + box_w // 2
            y1 = positions[i][1] + box_h
            x2 = positions[i + 1][0] + box_w // 2
            y2 = positions[i + 1][1]
        svg_items.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="#94a3b8" stroke-width="2" marker-end="url(#arrow)"/>'
        )

    total_cols = min(len(keywords), cols)
    total_rows = (len(keywords) + cols - 1) // cols
    svg_w = start_x * 2 + total_cols * box_w + (total_cols - 1) * gap_x
    svg_h = start_y * 2 + total_rows * box_h + (total_rows - 1) * gap_y

    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{svg_w}" height="{svg_h}" viewBox="0 0 {svg_w} {svg_h}">'
        '<defs><marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" '
        'markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
        '<path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8"/></marker></defs>'
        '<rect width="100%" height="100%" fill="#1e1e2e" rx="16"/>'
        + "".join(svg_items)
        + "</svg>"
    )
    return svg


def _mock_suggestions(content: str) -> str:
    return (
        "[FREE AI MODE]\n"
        "Suggestions:\n"
        "1) Add clear title and legend.\n"
        "2) Align shapes and use consistent spacing.\n"
        "3) Group related blocks by color.\n"
        "4) Label arrows with action names.\n"
        f"5) Reduce ambiguity in: {content[:80]}..."
    )


async def generate_diagram(prompt: str) -> str:
    """Generate a Mermaid diagram based on text prompt.

    Providers:
    - openai (paid)
    - ollama (free local)
    - mock (free fallback)
    """
    provider = _resolve_provider()
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert at creating detailed, professional Mermaid diagrams.

Guidelines:
- Choose the best diagram type: flowchart LR/TD, graph, sequence, state, class, mindmap, etc.
- Create DETAILED diagrams with multiple nodes and clear relationships
- Use subgraphs to group related concepts
- Add descriptive labels to nodes and edges
- For roadmaps/learning paths: use flowchart LR with subgraphs for each major topic
- For architectures: show all components and their connections
- For processes: show all steps clearly
- Return ONLY valid Mermaid syntax without markdown code blocks, explanations, or comments
- Ensure the diagram is comprehensive and informative""",
                    },
                    {
                        "role": "user",
                        "content": f"Create a detailed, comprehensive Mermaid diagram for: {prompt}",
                    },
                ],
                max_tokens=2000,
            )
            return response.choices[0].message.content or ""

        if provider == "ollama":
            return await _ollama_chat(
                f"Create a detailed, comprehensive Mermaid diagram for: {prompt}",
                """You are an expert at creating detailed, professional Mermaid diagrams.
Use subgraphs to group related concepts. Create comprehensive diagrams with multiple nodes.
Choose the best diagram type based on the prompt. Return ONLY valid Mermaid code without markdown blocks.""",
            )

        return _mock_diagram(prompt)
    except Exception as e:
        print(f"AI Error: {e}")
        return _mock_diagram(prompt)


async def analyze_sketch(image_url: str) -> str:
    """Analyze a sketch and provide suggestions."""
    provider = _resolve_provider()
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert at analyzing sketches and diagrams.",
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this sketch URL and give improvements: {image_url}",
                    },
                ],
                max_tokens=500,
            )
            return response.choices[0].message.content or ""

        if provider == "ollama":
            return await _ollama_chat(
                f"Analyze this sketch URL and give improvements: {image_url}",
                "You are an expert at diagram quality reviews.",
            )

        return _mock_suggestions(image_url)
    except Exception as e:
        print(f"AI Error: {e}")
        return _mock_suggestions(image_url)


async def suggest_edits(content: str) -> str:
    """Suggest improvements for diagram content."""
    provider = _resolve_provider()
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": "Provide concise, actionable suggestions for improving diagrams.",
                    },
                    {
                        "role": "user",
                        "content": f"Suggest improvements for this diagram/sketch: {content}",
                    },
                ],
                max_tokens=300,
            )
            return response.choices[0].message.content or ""

        if provider == "ollama":
            return await _ollama_chat(
                f"Suggest improvements for this diagram/sketch: {content}",
                "Provide concise bullet-point design suggestions.",
            )

        return _mock_suggestions(content)
    except Exception as e:
        print(f"AI Error: {e}")
        return _mock_suggestions(content)


async def generate_diagram_svg(prompt: str) -> dict:
    """Generate a Mermaid diagram + humanized explanation.

    Returns {"mermaid": "mermaid code...", "message": "…", "type": "mermaid"}.
    """
    provider = _resolve_provider()
    mermaid_code = ""
    try:
        if provider == "openai" and client:
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert at creating detailed, professional Mermaid diagrams. "
                            "Return ONLY valid Mermaid syntax without markdown code blocks. "
                            "Choose the best diagram type (flowchart LR/TD, graph, sequence, state, class, mindmap, etc.) based on the prompt. "
                            "Create comprehensive diagrams with:\n"
                            "- Multiple nodes showing all relevant concepts\n"
                            "- Subgraphs to group related items\n"
                            "- Clear, descriptive labels\n"
                            "- Proper connections showing relationships\n"
                            "For roadmaps/learning paths, use flowchart LR with detailed subgraphs for each topic area. "
                            "Make diagrams professional, informative, and suitable for technical documentation."
                        ),
                    },
                    {
                        "role": "user",
                        "content": f"Create a detailed, comprehensive Mermaid diagram for: {prompt}",
                    },
                ],
                max_tokens=2500,
            )
            mermaid_code = response.choices[0].message.content or ""
            # Clean up if wrapped in markdown code blocks
            mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()

        elif provider == "ollama":
            mermaid_code = await _ollama_chat(
                f"Create a detailed, comprehensive Mermaid diagram for: {prompt}",
                (
                    "You are an expert at creating detailed, professional Mermaid diagrams. "
                    "Use subgraphs to group related concepts. Create comprehensive diagrams with multiple nodes. "
                    "Return ONLY valid Mermaid syntax without markdown blocks. "
                    "Choose the best diagram type based on the prompt."
                ),
            )
            mermaid_code = mermaid_code.replace("```mermaid", "").replace("```", "").strip()
    except Exception as e:
        print(f"AI Mermaid Error: {e}")

    # Fallback to mock Mermaid diagram
    if not mermaid_code or not any(keyword in mermaid_code.lower() for keyword in ['graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram', 'mindmap']):
        mermaid_code = _mock_diagram(prompt)

    message = _humanize_response(prompt, "I've created a Mermaid diagram for you!")

    return {
        "mermaid": mermaid_code,
        "message": message,
        "type": "mermaid",
    }
