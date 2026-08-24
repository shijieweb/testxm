import urllib.request, json, sys

KB_URL = 'http://localhost:8765'

def health():
    resp = urllib.request.urlopen(f'{KB_URL}/health')
    return json.loads(resp.read())

def init(agent, persona='strict', role='', project=''):
    resp = urllib.request.urlopen(urllib.request.Request(
        f'{KB_URL}/api/init',
        data=json.dumps({'agent': agent, 'persona': persona, 'role': role, 'project': project}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    ))
    return json.loads(resp.read())

def query(kb_query, role='', project=''):
    resp = urllib.request.urlopen(urllib.request.Request(
        f'{KB_URL}/api/knowledge/query',
        data=json.dumps({'query': kb_query, 'role': role, 'project': project}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    ))
    return json.loads(resp.read())

def report(agent, role, content):
    resp = urllib.request.urlopen(urllib.request.Request(
        f'{KB_URL}/api/report',
        data=json.dumps({'agent': agent, 'role': role, 'content': content}).encode(),
        headers={'Content-Type': 'application/json'},
        method='POST'
    ))
    return json.loads(resp.read())

def list_knowledge():
    resp = urllib.request.urlopen(f'{KB_URL}/api/knowledge/list')
    return json.loads(resp.read())

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage:')
        print('  python askb_client.py health')
        print('  python askb_client.py init <agent> [persona] [role] [project]')
        print('  python askb_client.py query <keyword> [--role <role>] [--project <project>]')
        print('  python askb_client.py report <content> [--agent <agent>] [--role <role>]')
        print('  python askb_client.py list')
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == 'health':
        print(json.dumps(health(), indent=2, ensure_ascii=False))

    elif cmd == 'init':
        agent = sys.argv[2] if len(sys.argv) > 2 else 'workbuddy'
        persona = sys.argv[3] if len(sys.argv) > 3 else 'strict'
        role = sys.argv[4] if len(sys.argv) > 4 else ''
        project = sys.argv[5] if len(sys.argv) > 5 else ''
        result = init(agent, persona, role, project)
        print(json.dumps(result, indent=2, ensure_ascii=False)[:1000])
        print(f"\n[loaded {len(result.get('files_loaded',[]))} files]")

    elif cmd == 'query':
        if len(sys.argv) < 3:
            print('Usage: python askb_client.py query <keyword> [--role <role>] [--project <project>]')
            sys.exit(1)
        kb_query = sys.argv[2]
        role = ''
        project = ''
        i = 3
        while i < len(sys.argv):
            if sys.argv[i] == '--role' and i+1 < len(sys.argv):
                role = sys.argv[i+1]; i += 2
            elif sys.argv[i] == '--project' and i+1 < len(sys.argv):
                project = sys.argv[i+1]; i += 2
            else:
                i += 1
        result = query(kb_query, role, project)
        print(f"query: {kb_query} | role: {role or '(all)'} | project: {project or '(all)'}")
        print(f"命中 {result['count']} 条:")
        for r in result.get('results', []):
            print(f"  - [{r['path']}] verified={r.get('verified')}")
            print(f"    preview: {r['preview'][:80]}...")

    elif cmd == 'report':
        content = sys.argv[2] if len(sys.argv) > 2 else '测试经验'
        agent = 'workbuddy'
        role = 'director'
        i = 3
        while i < len(sys.argv):
            if sys.argv[i] == '--agent' and i+1 < len(sys.argv):
                agent = sys.argv[i+1]; i += 2
            elif sys.argv[i] == '--role' and i+1 < len(sys.argv):
                role = sys.argv[i+1]; i += 2
            else:
                i += 1
        result = report(agent, role, content)
        print(json.dumps(result, indent=2, ensure_ascii=False))

    elif cmd == 'list':
        result = list_knowledge()
        print(f"总知识条目: {result['total']}")
        for item in result.get('items', []):
            print(f"  - {item['path']} [{item.get('scope','?')}] verified={item.get('verified')}")

    else:
        print(f'Unknown command: {cmd}')
        sys.exit(1)
